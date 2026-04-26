from flask import Blueprint, request, jsonify, current_app, Response
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
import os
import io
import pandas as pd
from ..models.lead import Lead
from ..extensions import db
from ..models.user import User
from ..models.knowledge import KnowledgeBase
from datetime import datetime

files_bp = Blueprint('files', __name__)

ALLOWED_LEAD_EXTENSIONS = {'xlsx', 'xls', 'csv'}
ALLOWED_KB_EXTENSIONS = {'pdf', 'doc', 'docx', 'txt', 'jpg', 'jpeg', 'png', 'gif'}

# Column mapping for auto-mapping
COLUMN_ALIASES = {
    'name': ['name', 'full_name', 'fullname', 'contact_name', 'customer', 'họ tên', 'tên'],
    'phone': ['phone', 'phone_number', 'tel', 'telephone', 'mobile', 'số điện thoại', 'sdt'],
    'email': ['email', 'email_address', 'e-mail', 'mail'],
    'country': ['country', 'nation', 'quốc gia', 'nước', 'location'],
    'content': ['content', 'message', 'inquiry', 'note', 'notes', 'nội dung', 'tin nhắn', 'description'],
    'source': ['source', 'channel', 'nguồn', 'kênh'],
}


def allowed_file(filename, allowed_extensions):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in allowed_extensions


def auto_map_columns(df_columns):
    """Auto-map DataFrame columns to expected fields."""
    mapping = {}
    df_cols_lower = {col.lower().strip(): col for col in df_columns}

    for field, aliases in COLUMN_ALIASES.items():
        for alias in aliases:
            if alias in df_cols_lower:
                mapping[field] = df_cols_lower[alias]
                break

    return mapping


@files_bp.route('/upload/leads', methods=['POST'])
@jwt_required()
def upload_leads():
    """Upload Excel/CSV file with leads — supports auto field mapping."""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    if 'file' not in request.files:
        return jsonify({"error": "No file provided"}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400

    if not allowed_file(file.filename, ALLOWED_LEAD_EXTENSIONS):
        return jsonify({"error": "File type not allowed. Use Excel or CSV"}), 400

    try:
        if file.filename.endswith('.csv'):
            df = pd.read_csv(file)
        else:
            df = pd.read_excel(file)

        # Auto-map columns
        column_mapping = auto_map_columns(df.columns)

        # Check if we have at least 'name'
        if 'name' not in column_mapping:
            return jsonify({
                "error": "Could not find a 'name' column. Available columns: " + ", ".join(df.columns.tolist()),
                "available_columns": df.columns.tolist(),
                "mapped": column_mapping,
            }), 400

        uploaded_leads = []
        errors = []
        lead_ids = []

        for index, row in df.iterrows():
            try:
                name_val = str(row[column_mapping['name']]).strip()
                if not name_val or name_val == 'nan':
                    continue

                lead = Lead(
                    name=name_val,
                    phone=str(row[column_mapping['phone']]).strip() if 'phone' in column_mapping and pd.notna(row.get(column_mapping.get('phone'))) else None,
                    email=str(row[column_mapping['email']]).strip() if 'email' in column_mapping and pd.notna(row.get(column_mapping.get('email'))) else None,
                    country=str(row[column_mapping['country']]).strip() if 'country' in column_mapping and pd.notna(row.get(column_mapping.get('country'))) else None,
                    source=str(row[column_mapping['source']]).strip() if 'source' in column_mapping and pd.notna(row.get(column_mapping.get('source'))) else request.form.get('source', 'EXCEL_UPLOAD'),
                    content=str(row[column_mapping['content']]).strip() if 'content' in column_mapping and pd.notna(row.get(column_mapping.get('content'))) else '',
                )
                db.session.add(lead)
                db.session.flush()

                # Auto-assign
                from ..services.assignment_service import auto_assign_lead
                auto_assign_lead(lead)

                lead_ids.append(lead.id)
                uploaded_leads.append({
                    'id': lead.id,
                    'name': lead.name,
                    'email': lead.email,
                    'status': 'success',
                })

            except Exception as e:
                errors.append({
                    'row': index + 2,
                    'error': str(e),
                })

        db.session.commit()

        # Trigger AI processing for all new leads
        try:
            from celery_worker import process_lead_ai
            for lid in lead_ids:
                process_lead_ai.delay(lid)
        except Exception as e:
            print(f"Celery task error: {e}")

        return jsonify({
            "message": f"Successfully uploaded {len(uploaded_leads)} leads",
            "uploaded": len(uploaded_leads),
            "errors": errors,
            "total_processed": len(uploaded_leads) + len(errors),
            "column_mapping": column_mapping,
        }), 200

    except Exception as e:
        return jsonify({"error": f"Error processing file: {str(e)}"}), 500


@files_bp.route('/upload/knowledge', methods=['POST'])
@jwt_required()
def upload_knowledge():
    """Upload file to knowledge base."""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    if user.role == 'SALES':
        return jsonify({"error": "Unauthorized"}), 403

    if 'file' not in request.files:
        return jsonify({"error": "No file provided"}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400

    if not allowed_file(file.filename, ALLOWED_KB_EXTENSIONS):
        return jsonify({"error": "File type not allowed"}), 400

    title = request.form.get('title', file.filename)
    content = request.form.get('content', '')
    category = request.form.get('category', 'Documents')
    tags = request.form.get('tags', '')

    try:
        upload_dir = os.path.join(current_app.instance_path, 'uploads', 'knowledge')
        os.makedirs(upload_dir, exist_ok=True)

        filename = secure_filename(file.filename)
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"{timestamp}_{filename}"
        file_path = os.path.join(upload_dir, filename)
        file.save(file_path)

        kb_item = KnowledgeBase(
            title=title,
            content=content or f"File: {file.filename}",
            category=category,
            tags=tags,
            file_path=file_path,
        )
        db.session.add(kb_item)
        db.session.commit()

        # Generate embedding
        text_content = content
        if not text_content and file.filename.endswith('.txt'):
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    text_content = f.read()
            except Exception:
                pass

        if text_content:
            try:
                from ..services.ai_service import AIService
                ai_service = AIService()
                embedding = ai_service.get_embedding(text_content)
                if embedding:
                    kb_item.embedding = embedding
                    db.session.commit()
            except Exception:
                pass

        return jsonify({
            "message": "File uploaded successfully",
            "knowledge_item": kb_item.to_dict(),
        }), 200

    except Exception as e:
        return jsonify({"error": f"Error uploading file: {str(e)}"}), 500


@files_bp.route('/template/leads', methods=['GET'])
@jwt_required()
def download_lead_template():
    """Download Excel template for lead upload."""
    template_data = {
        'name': ['John Doe', 'Jane Smith', 'Example Contact'],
        'phone': ['+1234567890', '+0987654321', '+1111111111'],
        'email': ['john@example.com', 'jane@example.com', 'contact@example.com'],
        'country': ['USA', 'Vietnam', 'Singapore'],
        'content': [
            'Interested in bamboo house for office space',
            'Looking for small bamboo house for residential use',
            'Need information about pricing and shipping',
        ],
        'source': ['Manual', 'Alibaba', 'Web'],
    }

    df = pd.DataFrame(template_data)

    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='xlsxwriter') as writer:
        df.to_excel(writer, index=False, sheet_name='Leads Template')

        instructions = pd.DataFrame({
            'Column': ['name', 'phone', 'email', 'country', 'content', 'source'],
            'Description': [
                'Full name of the contact',
                'Phone number (optional)',
                'Email address (optional)',
                'Country of the contact',
                'Message or inquiry content',
                'Lead source channel (optional)',
            ],
            'Required': ['Yes', 'No', 'No', 'No', 'No', 'No'],
            'Aliases': [
                'name, full_name, customer, họ tên',
                'phone, tel, mobile, số điện thoại',
                'email, e-mail, mail',
                'country, nation, quốc gia',
                'content, message, inquiry, nội dung',
                'source, channel, nguồn',
            ],
        })
        instructions.to_excel(writer, index=False, sheet_name='Instructions')

    output.seek(0)

    return Response(
        output.getvalue(),
        mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        headers={'Content-Disposition': 'attachment; filename=lead_upload_template.xlsx'},
    )

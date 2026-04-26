import io
import csv
from flask import Blueprint, request, jsonify, Response
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..models.lead import Lead
from ..models.user import User
from ..extensions import db
from ..models.activity_log import ActivityLog
from sqlalchemy import func, extract
from datetime import datetime, timedelta

analytics_bp = Blueprint('analytics', __name__)


def _parse_date_range():
    """Parse date_from / date_to query params."""
    date_from = request.args.get('date_from')
    date_to = request.args.get('date_to')
    try:
        if date_from:
            date_from = datetime.fromisoformat(date_from)
        if date_to:
            date_to = datetime.fromisoformat(date_to).replace(hour=23, minute=59, second=59)
    except ValueError:
        date_from = None
        date_to = None
    return date_from, date_to


def _apply_date_filter(query, date_from, date_to):
    if date_from:
        query = query.filter(Lead.created_at >= date_from)
    if date_to:
        query = query.filter(Lead.created_at <= date_to)
    return query


@analytics_bp.route('/summary', methods=['GET'])
@jwt_required()
def get_summary():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    query = Lead.query
    if user.role == 'SALES':
        query = query.filter_by(assigned_to=user.id)

    date_from, date_to = _parse_date_range()
    query = _apply_date_filter(query, date_from, date_to)

    total_leads = query.count()
    new_leads = query.filter_by(status='NEW').count()
    hot_leads = query.filter_by(temperature='HOT').count()
    sla_violations = query.filter_by(sla_violated=True).count()

    avg_response_time = (
        query.filter(Lead.response_time_seconds.isnot(None))
        .with_entities(func.avg(Lead.response_time_seconds))
        .scalar()
    ) or 0

    leads_by_country = query.with_entities(Lead.country, func.count(Lead.id)).group_by(Lead.country).all()
    leads_by_source = query.with_entities(Lead.source, func.count(Lead.id)).group_by(Lead.source).all()

    won_leads = query.filter_by(status='WON').count()
    conversion_rate = (won_leads / total_leads * 100) if total_leads > 0 else 0

    pipeline_data = query.with_entities(Lead.status, func.count(Lead.id)).group_by(Lead.status).all()
    temp_data = query.with_entities(Lead.temperature, func.count(Lead.id)).group_by(Lead.temperature).all()

    total_value = query.with_entities(func.sum(Lead.estimated_value)).scalar() or 0
    won_value = query.filter_by(status='WON').with_entities(func.sum(Lead.estimated_value)).scalar() or 0

    today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    leads_today = query.filter(Lead.created_at >= today).count()

    return jsonify({
        "total_leads": total_leads,
        "new_leads": new_leads,
        "hot_leads": hot_leads,
        "leads_today": leads_today,
        "sla_violations": sla_violations,
        "avg_response_time": int(avg_response_time),
        "conversion_rate": round(conversion_rate, 2),
        "total_pipeline_value": total_value,
        "won_value": won_value,
        "leads_by_country": [{"country": c or "Unknown", "count": cnt} for c, cnt in leads_by_country],
        "leads_by_source": [{"source": s or "Manual", "count": cnt} for s, cnt in leads_by_source],
        "pipeline_distribution": [{"status": st, "count": cnt} for st, cnt in pipeline_data],
        "temperature_distribution": [{"temperature": t or "Unknown", "count": cnt} for t, cnt in temp_data],
    }), 200


@analytics_bp.route('/trends', methods=['GET'])
@jwt_required()
def get_trends():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    query = Lead.query
    if user.role == 'SALES':
        query = query.filter_by(assigned_to=user.id)

    days = request.args.get('days', 30, type=int)
    start_date = datetime.utcnow() - timedelta(days=days)

    date_from, date_to = _parse_date_range()
    if date_from:
        start_date = date_from

    daily_leads = (
        query.filter(Lead.created_at >= start_date)
        .with_entities(func.date(Lead.created_at).label('date'), func.count(Lead.id).label('count'))
        .group_by(func.date(Lead.created_at))
        .order_by(func.date(Lead.created_at))
        .all()
    )

    daily_won = (
        query.filter(Lead.created_at >= start_date, Lead.status == 'WON')
        .with_entities(func.date(Lead.updated_at).label('date'), func.count(Lead.id).label('count'))
        .group_by(func.date(Lead.updated_at))
        .order_by(func.date(Lead.updated_at))
        .all()
    )

    won_map = {str(d): c for d, c in daily_won}

    return jsonify({
        "daily_trend": [
            {"date": str(date), "new": count, "converted": won_map.get(str(date), 0)}
            for date, count in daily_leads
        ],
    }), 200


@analytics_bp.route('/performance', methods=['GET'])
@jwt_required()
def get_performance():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    if user.role == 'SALES':
        return jsonify({"error": "Unauthorized"}), 403

    sales_performance = (
        db.session.query(
            User.id, User.name, User.email,
            func.count(Lead.id).label('total_leads'),
            func.sum(func.case([(Lead.status == 'WON', 1)], else_=0)).label('won_leads'),
            func.avg(Lead.response_time_seconds).label('avg_response_time'),
            func.sum(Lead.estimated_value).label('total_value'),
        )
        .join(Lead, User.id == Lead.assigned_to)
        .group_by(User.id, User.name, User.email)
        .all()
    )

    performance_data = []
    for uid, name, email, total, won, avg_time, total_val in sales_performance:
        conversion_rate = (won / total * 100) if total > 0 else 0
        performance_data.append({
            "id": uid, "name": name, "email": email,
            "total_leads": total, "won_leads": won or 0,
            "conversion_rate": round(conversion_rate, 2),
            "avg_response_time": int(avg_time) if avg_time else 0,
            "total_value": float(total_val) if total_val else 0,
        })

    return jsonify({"sales_performance": performance_data}), 200


@analytics_bp.route('/funnel', methods=['GET'])
@jwt_required()
def get_funnel():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    query = Lead.query
    if user.role == 'SALES':
        query = query.filter_by(assigned_to=user.id)

    date_from, date_to = _parse_date_range()
    query = _apply_date_filter(query, date_from, date_to)

    total = query.count()
    contacted = query.filter(Lead.status.in_(['CONTACTED', 'WHATSAPP_MOVED', 'QUOTED', 'NEGOTIATION', 'WON'])).count()
    quoted = query.filter(Lead.status.in_(['QUOTED', 'NEGOTIATION', 'WON'])).count()
    negotiation = query.filter(Lead.status.in_(['NEGOTIATION', 'WON'])).count()
    won = query.filter_by(status='WON').count()

    return jsonify({
        "funnel": [
            {"stage": "Total Leads", "count": total},
            {"stage": "Contacted", "count": contacted},
            {"stage": "Quoted", "count": quoted},
            {"stage": "Negotiation", "count": negotiation},
            {"stage": "Won", "count": won},
        ]
    }), 200


# ─── Activity Log ───

@analytics_bp.route('/activity', methods=['GET'])
@jwt_required()
def get_activity():
    """Get activity log with pagination."""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    query = ActivityLog.query
    if user.role == 'SALES':
        query = query.filter_by(user_id=user.id)

    # Filters
    action = request.args.get('action')
    if action:
        query = query.filter_by(action=action)

    lead_id = request.args.get('lead_id', type=int)
    if lead_id:
        query = query.filter_by(lead_id=lead_id)

    target_user = request.args.get('user_id', type=int)
    if target_user:
        query = query.filter_by(user_id=target_user)

    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 30, type=int)

    pagination = query.order_by(ActivityLog.created_at.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )

    return jsonify({
        'activities': [a.to_dict() for a in pagination.items],
        'total': pagination.total,
        'page': pagination.page,
        'pages': pagination.pages,
    }), 200


@analytics_bp.route('/activity/lead/<int:lead_id>', methods=['GET'])
@jwt_required()
def get_lead_activity(lead_id):
    """Get activity timeline for a specific lead."""
    activities = (
        ActivityLog.query
        .filter_by(lead_id=lead_id)
        .order_by(ActivityLog.created_at.desc())
        .limit(50)
        .all()
    )
    return jsonify([a.to_dict() for a in activities]), 200


# ─── Export ───

@analytics_bp.route('/export/leads', methods=['GET'])
@jwt_required()
def export_leads_csv():
    """Export leads as CSV."""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    query = Lead.query
    if user.role == 'SALES':
        query = query.filter_by(assigned_to=user.id)

    date_from, date_to = _parse_date_range()
    query = _apply_date_filter(query, date_from, date_to)

    leads = query.order_by(Lead.created_at.desc()).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        'ID', 'Name', 'Email', 'Phone', 'Country', 'Source', 'Status',
        'Temperature', 'Estimated Value', 'Language', 'Intent', 'Budget',
        'Urgency', 'AI Summary', 'Assigned To', 'SLA Violated',
        'Response Time (s)', 'Created At', 'Updated At',
    ])

    for lead in leads:
        writer.writerow([
            lead.id, lead.name, lead.email, lead.phone, lead.country,
            lead.source, lead.status, lead.temperature, lead.estimated_value,
            lead.language, lead.intent, lead.budget, lead.urgency,
            lead.ai_summary, lead.assigned_user.name if lead.assigned_user else '',
            lead.sla_violated, lead.response_time_seconds,
            lead.created_at.isoformat() if lead.created_at else '',
            lead.updated_at.isoformat() if lead.updated_at else '',
        ])

    output.seek(0)
    return Response(
        output.getvalue(),
        mimetype='text/csv',
        headers={'Content-Disposition': f'attachment; filename=leads_export_{datetime.utcnow().strftime("%Y%m%d")}.csv'},
    )


@analytics_bp.route('/export/performance', methods=['GET'])
@jwt_required()
def export_performance_csv():
    """Export sales performance as CSV."""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    if user.role == 'SALES':
        return jsonify({"error": "Unauthorized"}), 403

    perf = (
        db.session.query(
            User.name, User.email,
            func.count(Lead.id),
            func.sum(func.case([(Lead.status == 'WON', 1)], else_=0)),
            func.avg(Lead.response_time_seconds),
            func.sum(Lead.estimated_value),
        )
        .join(Lead, User.id == Lead.assigned_to)
        .group_by(User.id, User.name, User.email)
        .all()
    )

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(['Name', 'Email', 'Total Leads', 'Won', 'Conversion %', 'Avg Response (s)', 'Total Value'])

    for name, email, total, won, avg_t, val in perf:
        conv = round((won / total * 100) if total > 0 else 0, 2)
        writer.writerow([name, email, total, won or 0, conv, int(avg_t) if avg_t else 0, float(val) if val else 0])

    output.seek(0)
    return Response(
        output.getvalue(),
        mimetype='text/csv',
        headers={'Content-Disposition': f'attachment; filename=performance_{datetime.utcnow().strftime("%Y%m%d")}.csv'},
    )


# ─── AI Status ───

@analytics_bp.route('/ai-status', methods=['GET'])
@jwt_required()
def ai_status():
    """Check Ollama AI service health."""
    import requests as http_requests
    from flask import current_app

    base_url = current_app.config.get('OLLAMA_BASE_URL', 'http://localhost:11434')
    model = current_app.config.get('OLLAMA_MODEL', 'llama3')
    embed_model = current_app.config.get('OLLAMA_EMBED_MODEL', 'nomic-embed-text')

    result = {
        'ollama_url': base_url,
        'chat_model': model,
        'embed_model': embed_model,
        'ollama_online': False,
        'models_available': [],
    }

    try:
        resp = http_requests.get(f"{base_url}/api/tags", timeout=5)
        if resp.status_code == 200:
            result['ollama_online'] = True
            models = resp.json().get('models', [])
            result['models_available'] = [m.get('name', '') for m in models]
            result['chat_model_ready'] = any(model in m.get('name', '') for m in models)
            result['embed_model_ready'] = any(embed_model in m.get('name', '') for m in models)
    except Exception as e:
        result['error'] = str(e)

    return jsonify(result), 200

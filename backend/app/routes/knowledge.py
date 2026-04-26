from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from ..models.knowledge import KnowledgeBase
from ..extensions import db
from ..services.ai_service import AIService

knowledge_bp = Blueprint('knowledge', __name__)

@knowledge_bp.route('', methods=['GET'])
@jwt_required()
def get_knowledge():
    query_text = request.args.get('q')
    if query_text:
        ai_service = AIService()
        query_embedding = ai_service.get_embedding(query_text)
        if query_embedding:
            all_items = KnowledgeBase.query.all()
            results = ai_service.find_relevant_knowledge(query_embedding, all_items)
            return jsonify([item.to_dict() for item in results]), 200
            
    items = KnowledgeBase.query.all()
    return jsonify([item.to_dict() for item in items]), 200

@knowledge_bp.route('', methods=['POST'])
@jwt_required()
def create_knowledge():
    data = request.get_json()
    ai_service = AIService()
    embedding = ai_service.get_embedding(data.get('content'))
    
    item = KnowledgeBase(
        title=data.get('title'),
        content=data.get('content'),
        category=data.get('category'),
        tags=data.get('tags'),
        embedding=embedding
    )
    db.session.add(item)
    db.session.commit()
    return jsonify(item.to_dict()), 201

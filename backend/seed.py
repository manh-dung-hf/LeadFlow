from app import create_app
from app.extensions import db
from app.models.user import User
from app.models.lead import Lead
from app.models.knowledge import KnowledgeBase
from app.models.integration import Integration
from app.models.script import Script
from datetime import datetime, timedelta
import random


def seed():
    app = create_app()
    with app.app_context():
        db.create_all()

        # --- Users ---
        if not User.query.filter_by(email='admin@leadflow.ai').first():
            admin = User(email='admin@leadflow.ai', name='System Admin', role='ADMIN', max_leads=100)
            admin.set_password('admin123')
            db.session.add(admin)

            manager = User(email='manager@leadflow.ai', name='Tran Minh Duc', role='MANAGER', max_leads=80)
            manager.set_password('manager123')
            db.session.add(manager)

            sales1 = User(email='sales@leadflow.ai', name='An Nguyen', role='SALES', max_leads=50)
            sales1.set_password('sales123')
            db.session.add(sales1)

            sales2 = User(email='sales2@leadflow.ai', name='Kim Le', role='SALES', max_leads=50)
            sales2.set_password('sales123')
            db.session.add(sales2)

            db.session.commit()
            print("✅ Users seeded.")

        # --- Knowledge Base ---
        if KnowledgeBase.query.count() == 0:
            items = [
                KnowledgeBase(
                    title="Eco-Lite Series Specs",
                    content="The Eco-Lite series is our entry-level bamboo house line. Prices start at $18,500. Dimensions: 4m x 6m. Includes 1 bedroom, 1 bathroom, and a small terrace. Perfect for vacation homes or small offices.",
                    category="Product Catalog",
                    tags="bamboo,eco-lite,budget,small",
                ),
                KnowledgeBase(
                    title="Premium Villa Series",
                    content="The Premium Villa series features luxury bamboo houses from $45,000 to $120,000. Sizes range from 8m x 10m to 15m x 20m. Includes 2-5 bedrooms, modern kitchen, and panoramic terrace. Customizable layouts available.",
                    category="Product Catalog",
                    tags="bamboo,premium,villa,luxury",
                ),
                KnowledgeBase(
                    title="Shipping to USA",
                    content="Shipping to the USA takes 4-6 weeks. Cost varies by state: West Coast ~$2,500, East Coast ~$4,000. All permits and customs documentation are handled by us. Container shipping via major ports.",
                    category="Shipping Info",
                    tags="shipping,usa,logistics",
                ),
                KnowledgeBase(
                    title="Shipping to Europe",
                    content="Shipping to Europe takes 5-8 weeks. Cost ranges from $3,000 to $5,500 depending on destination. We handle all EU customs and CE certification requirements.",
                    category="Shipping Info",
                    tags="shipping,europe,logistics",
                ),
                KnowledgeBase(
                    title="Warranty Policy",
                    content="All structures come with a 10-year structural warranty and 2-year warranty on finishes and fixtures. Extended warranty available for additional 5 years at 5% of purchase price.",
                    category="Policy",
                    tags="warranty,policy,guarantee",
                ),
                KnowledgeBase(
                    title="Installation Guide",
                    content="Installation takes 2-4 weeks depending on size. We provide a team of 4-6 workers. Foundation preparation by client. We offer remote installation support for DIY customers at reduced cost.",
                    category="Manuals",
                    tags="installation,setup,guide",
                ),
                KnowledgeBase(
                    title="Pricing FAQ",
                    content="Q: Do you offer bulk discounts? A: Yes, 5% off for 3+ units, 10% off for 10+ units. Q: Payment terms? A: 30% deposit, 40% before shipping, 30% after installation. Q: Currency? A: USD, EUR, VND accepted.",
                    category="FAQ",
                    tags="pricing,faq,discount,payment",
                ),
            ]
            db.session.bulk_save_objects(items)
            db.session.commit()
            print("✅ Knowledge base seeded.")

        # --- Leads ---
        if Lead.query.count() == 0:
            sales_users = User.query.filter(User.role.in_(['SALES', 'MANAGER'])).all()
            now = datetime.utcnow()

            leads_data = [
                {"name": "Sarah Mitchell", "phone": "+1 415 555 0142", "email": "s.mitchell@stripe.com", "country": "USA", "source": "WHATSAPP", "content": "Hi, I saw your ad — interested in pricing for a bamboo office space for 50 people.", "temperature": "HOT", "status": "CONTACTED", "estimated_value": 48000},
                {"name": "Nguyen Van A", "phone": "0987654321", "email": "anv@gmail.com", "country": "Vietnam", "source": "ZALO", "content": "Cần tìm nhà tre nhỏ lắp đặt ở Đà Lạt. Ngân sách tầm 200-300 triệu.", "temperature": "HOT", "status": "QUOTED", "estimated_value": 12500},
                {"name": "Hiroshi Tanaka", "phone": "+81 80 1234 5678", "email": "h.tanaka@rakuten.co.jp", "country": "Japan", "source": "ALIBABA", "content": "Looking for bamboo resort structures. Need 10 units for a new eco-resort project in Okinawa.", "temperature": "HOT", "status": "NEGOTIATION", "estimated_value": 650000},
                {"name": "Marcus Weber", "phone": "+49 170 123 4567", "email": "m.weber@siemens.de", "country": "Germany", "source": "WEB", "content": "Interested in your Premium Villa series for a sustainable housing project. Budget around €100k per unit.", "temperature": "HOT", "status": "CONTACTED", "estimated_value": 124000},
                {"name": "Le Hoang Nam", "phone": "+84 93 345 6789", "email": "nam.le@tiki.vn", "country": "Vietnam", "source": "ZALO", "content": "Muốn hỏi giá nhà tre cho quán cafe. Diện tích khoảng 30m2.", "temperature": "WARM", "status": "NEW", "estimated_value": 8400},
                {"name": "Michael Scott", "phone": "+1 555 123 456", "email": "michael@dundermifflin.com", "country": "USA", "source": "TELEGRAM", "content": "Looking for a small office space for my paper company. Bamboo looks cool. Budget around 15k.", "temperature": "WARM", "status": "NEW", "estimated_value": 15000},
                {"name": "Nguyen Thi Lan", "phone": "+84 91 234 5678", "email": "lan.nguyen@fpt.com.vn", "country": "Vietnam", "source": "TELEGRAM", "content": "FPT muốn đặt 5 căn nhà tre cho khu nghỉ dưỡng nhân viên tại Đà Nẵng.", "temperature": "HOT", "status": "QUOTED", "estimated_value": 289000},
                {"name": "Emma Johnson", "phone": "+44 7911 123456", "email": "emma.j@gmail.com", "country": "UK", "source": "WEB", "content": "Just browsing. Saw your bamboo houses on Instagram. How much for the smallest one?", "temperature": "COLD", "status": "NEW", "estimated_value": 0},
                {"name": "Park Jimin", "phone": "+82 10 1234 5678", "email": "jimin.park@samsung.kr", "country": "South Korea", "source": "ALIBABA", "content": "Samsung CSR team looking for eco-friendly structures for community project. Need proposal for 3 units.", "temperature": "WARM", "status": "CONTACTED", "estimated_value": 75000},
                {"name": "Carlos Rodriguez", "phone": "+52 55 1234 5678", "email": "carlos@resort.mx", "country": "Mexico", "source": "WHATSAPP", "content": "Hola! Need bamboo bungalows for beach resort. 8 units, delivery to Cancun.", "temperature": "HOT", "status": "NEW", "estimated_value": 320000},
            ]

            for i, data in enumerate(leads_data):
                lead = Lead(
                    **data,
                    assigned_to=random.choice(sales_users).id if sales_users else None,
                    created_at=now - timedelta(hours=random.randint(1, 72)),
                )
                db.session.add(lead)

            db.session.commit()

            # Update user lead counts
            for user in sales_users:
                user.current_lead_count = Lead.query.filter_by(assigned_to=user.id).count()
            db.session.commit()
            print("✅ Leads seeded.")

        # --- Integrations ---
        if Integration.query.count() == 0:
            integrations = [
                Integration(name="telegram", config={"token": "", "notify_chat_id": ""}, is_active=False),
                Integration(name="whatsapp", config={"api_key": "", "api_url": "", "phone_number_id": ""}, is_active=False),
                Integration(name="zalo", config={"oa_id": "", "app_id": "", "secret_key": ""}, is_active=False),
                Integration(name="alibaba", config={"webhook_secret": ""}, is_active=False),
            ]
            db.session.bulk_save_objects(integrations)
            db.session.commit()
            print("✅ Integrations seeded.")

        # --- Scripts ---
        if Script.query.count() == 0:
            scripts = [
                Script(title="First Contact Greeting", content="Hi {{name}}, thank you for reaching out to us! I'm {{sales_name}} from LeadFlow. I'd love to help you find the perfect bamboo solution. Could you tell me more about what you're looking for?", category="greeting"),
                Script(title="Vietnamese Greeting", content="Xin chào {{name}}, cảm ơn bạn đã liên hệ với chúng tôi! Tôi là {{sales_name}} từ LeadFlow. Tôi rất vui được hỗ trợ bạn. Bạn có thể cho tôi biết thêm về nhu cầu của mình không?", category="greeting"),
                Script(title="Ask for WhatsApp", content="{{name}}, for faster communication, would you prefer to continue our conversation on WhatsApp? I can share product photos and videos there too. My number is {{phone}}.", category="qualification"),
                Script(title="Send Quote", content="Hi {{name}}, based on our discussion, here's a summary:\n\nProduct: {{product}}\nPrice: {{price}}\nShipping: {{shipping}}\nTimeline: {{timeline}}\n\nWould you like to proceed or have any questions?", category="quote"),
                Script(title="Price Objection", content="I understand budget is important, {{name}}. Our pricing reflects the quality and sustainability of our materials. However, we do offer:\n- Bulk discounts (5-10% off)\n- Flexible payment terms\n- Smaller models starting at $18,500\n\nWould any of these options work better for you?", category="objection"),
                Script(title="Timing Objection", content="Totally fair, {{name}}. What would need to be true 90 days from now for this to be a priority? I'm happy to circle back then with a tailored proposal.", category="objection"),
                Script(title="Soft Close", content="Based on everything we've discussed, {{name}}, the {{product}} seems like a great fit. Should we move forward with the deposit to secure your spot in our production queue?", category="closing"),
                Script(title="Urgency Close", content="Just a heads up, {{name}} — we're currently running at 85% production capacity this quarter. To guarantee your delivery timeline, I'd recommend we lock in your order this week. Shall I prepare the contract?", category="closing"),
                Script(title="Follow-up After No Response", content="Hi {{name}}, just checking in! I wanted to make sure you received the information I sent. Is there anything else I can help with or any questions about our bamboo solutions?", category="follow_up"),
                Script(title="Post-Quote Follow-up", content="Hi {{name}}, I hope you had a chance to review the quote I sent. I'm available to discuss any adjustments or answer questions. Would you like to schedule a quick call?", category="follow_up"),
            ]
            db.session.bulk_save_objects(scripts)
            db.session.commit()
            print("✅ Scripts seeded.")

        print("\n🎉 Database seeded successfully!")
        print("Default credentials:")
        print("  Admin:   admin@leadflow.ai / admin123")
        print("  Manager: manager@leadflow.ai / manager123")
        print("  Sales:   sales@leadflow.ai / sales123")
        print("  Sales2:  sales2@leadflow.ai / sales123")


if __name__ == '__main__':
    seed()

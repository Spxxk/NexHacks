# """Seed initial cameras and ambulances."""
# from sqlmodel import Session

# import sys
# from pathlib import Path
# sys.path.insert(0, str(Path(__file__).parent))

# from models import Camera, Ambulance, AmbulanceStatus


# def seed_data():
#     """Seed cameras and ambulances at startup."""
#     with Session(engine) as session:
#         # Seed cameras (10 cameras)
#         cameras_data = [
#             {"id": "CAM_12", "lat": 40.7501, "lng": -73.9866, "latest_frame_url": "http://localhost:5055/latest_frame", "name": "Astra-12"},
#             {"id": "CAM_18", "lat": 40.7488, "lng": -73.9848, "latest_frame_url": "http://localhost:5055/latest_frame", "name": "Astra-18"},
#             {"id": "CAM_06", "lat": 40.7439, "lng": -73.9742, "latest_frame_url": "http://localhost:5055/latest_frame", "name": "Astra-06"},
#             {"id": "CAM_01", "lat": 40.7519, "lng": -73.9881, "latest_frame_url": "http://localhost:5055/latest_frame", "name": "Astra-01"},
#             {"id": "CAM_02", "lat": 40.7414, "lng": -73.9690, "latest_frame_url": "http://localhost:5055/latest_frame", "name": "Astra-02"},
#             {"id": "CAM_03", "lat": 40.7495, "lng": -73.9874, "latest_frame_url": "http://localhost:5055/latest_frame", "name": "Astra-03"},
#             {"id": "CAM_04", "lat": 40.7422, "lng": -73.9721, "latest_frame_url": "http://localhost:5055/latest_frame", "name": "Astra-04"},
#             {"id": "CAM_05", "lat": 40.7550, "lng": -73.9850, "latest_frame_url": "http://localhost:5055/latest_frame", "name": "Astra-05"},
#             {"id": "CAM_07", "lat": 40.7400, "lng": -73.9700, "latest_frame_url": "http://localhost:5055/latest_frame", "name": "Astra-07"},
#             {"id": "CAM_08", "lat": 40.7520, "lng": -73.9800, "latest_frame_url": "http://localhost:5055/latest_frame", "name": "Astra-08"},
#         ]
        
#         for cam_data in cameras_data:
#             existing = session.get(Camera, cam_data["id"])
#             if not existing:
#                 camera = Camera(**cam_data)
#                 session.add(camera)
        
#         # Seed ambulances (3 ambulances)
#         ambulances_data = [
#             {"lat": 40.7414, "lng": -73.9690, "status": AmbulanceStatus.IDLE},
#             {"lat": 40.7519, "lng": -73.9881, "status": AmbulanceStatus.IDLE},
#             {"lat": 40.7450, "lng": -73.9750, "status": AmbulanceStatus.IDLE},
#         ]
        
#         # Check if ambulances already exist (count them)
#         from sqlmodel import select
#         statement = select(Ambulance)
#         existing_ambulances = session.exec(statement).all()
        
#         if len(existing_ambulances) == 0:
#             for amb_data in ambulances_data:
#                 ambulance = Ambulance(**amb_data)
#                 session.add(ambulance)
        
#         session.commit()
#         print(f"✅ Seeded {len(cameras_data)} cameras and {len(ambulances_data)} ambulances")

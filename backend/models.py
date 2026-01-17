from beanie import Document
# Define a sample Beanie Document (MongoDB collection model)
class City(Document):
    name: str
    country: str

    class Settings:
        name = "cities"  # collection name in MongoDB   
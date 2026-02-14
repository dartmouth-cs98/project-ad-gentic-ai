# Base image (python 3.11 slim)
FROM python:3.11-slim

# Copy the requirements file into the container at root
COPY requirements.txt ./

# Install required packages from requirements.txt
RUN pip install -r requirements.txt

# Copy the rest of the application code
COPY . .

# Expose the port the app runs on
EXPOSE 8000

# Start application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]

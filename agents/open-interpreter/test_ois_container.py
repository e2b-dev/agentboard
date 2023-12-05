import requests
import time

def connect_to_docker():
    url = "http://localhost:8080/helloworld"
    while True:
        try:
            response = requests.get(url, stream=True)
            if response.status_code == 200:
                print("Docker container connection is ready.")
                break
        except Exception as e:
            print("Waiting for docker container to be ready...")
            time.sleep(1)

def interactive_chat():
    print("Welcome to the interactive chat! Connecting to docker container at port 8080...")
    connect_to_docker()
    print()
    while True:
        message = input("Enter your message: ")
        response = requests.get(f"http://localhost:8080/chat?message={message}", stream=True)
        for line in response.iter_lines():
            if line:
                print("Response from docker container: ", line.decode())

interactive_chat()


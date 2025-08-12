import subprocess
import os
import time
# Define the path to your local repository and the command to start your server
REPO_PATH = "/mnt/sda1/mango1_home/PALAScribe1"  # <-- CHANGE THIS to the actual path
def check_path_exists(path):
    res = os.path.exists(path)
    if res:
        print(f"Path exists: {path}")
    else:
        path = os.getcwd()
        print(f"Path does not exist setting to CWD: {REPO_PATH}")
    return path
REPO_PATH = check_path_exists(REPO_PATH)
print("REPO_PATH=",REPO_PATH)
def update_repository():
    """
    Pulls the latest changes from the Git repository.
    """
    try:
        print("Checking for updates...")
        # Change the current working directory to the repository path
        os.chdir(REPO_PATH)
        
        # Run the git pull command
        result = subprocess.run(["git", "pull"], capture_output=True,text=True)
        print(result)
        if "Already up to date" in  result.stdout:
            print("Already up to date recieved")
            return False
        else:
            print("Git pull got updates")
            return True
        
        print("Repository updated successfully!")
    except FileNotFoundError:
        print(f"Error: The directory {REPO_PATH} does not exist.")
        return False
    except subprocess.CalledProcessError as e:
        print(f"Error during git pull: {e}")
        return False
    return True

def stop_server():
    print("Stopping Server...")
    print("Killing Whisper Server..")
    

def start_server():
    """
    Starts the server process.
    """
    try:
        print("Starting the server...")
        # Start the server command, redirecting output for better logging
        subprocess.run(SERVER_COMMAND, cwd=REPO_PATH)
        print("Server process finished.")
    except FileNotFoundError:
        print(f"Error: The command {SERVER_COMMAND[0]} was not found. Check your path.")
    except Exception as e:
        print(f"An unexpected error occurred while starting the server: {e}")

if __name__ == "__main__":
    
    while True:
        res = update_repository()
        if res == True:
            print("Restaring Server")
            #stop_server()
            start_server()
        
        time.sleep(60*10)  # Sleep for 10 minutes before checking again
        print("Checking for updates again...")


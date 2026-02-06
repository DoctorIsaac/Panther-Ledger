from app.db.auth_service import register_user, login_user

def main():
    #Temporary Login
    print("Welcome")
    print("1 - Login")
    print("2 - Register")
    print("3 - Exit")
    choice = int(input("Enter your choice: "))

    if choice not in [1,2]:
        print("Exiting")
        return

    if choice == 1:
        username = input("Enter your username: ").strip()
        password = input("Enter your password: ")

        if login_user(username, password):
            print("Logged in")
        else:
            print("Login failed")
    else:
        username = input("Enter your username: ").strip()
        password = input("Enter your password: ")
        first_name = input("Enter your first name: ")
        last_name = input("Enter your last name: ")
        email = input("Enter your email: ")
        phone_num = input("Enter your phone number: ")
        address = input("Enter your address: ")
        zip_code = input("Enter your zip code: ")

        if register_user(username, password, first_name, last_name, email, phone_num, address, zip_code):
            print("User registered")
        else:
            print("User not registered")

if __name__ == "__main__":
    main()

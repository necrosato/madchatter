import socket
import threading

connection_data = ('irc.chat.twitch.tv', 6667)
token = 'oauth:dbpbnw1pl0qr5twvjhxlsxtsovuxvb'
user = 'necrosato'
channel = '#necrosato'

server = socket.socket()
server.connect(connection_data)
server.send(bytes('PASS ' + token + '\r\n', 'utf-8'))
server.send(bytes('NICK ' + user + '\r\n', 'utf-8'))
server.send(bytes('JOIN ' + channel + '\r\n', 'utf-8'))

print(server)

def print_chat():
    while True:
        line = server.recv(2048).decode('utf-8')
        print(line)

def send_chat():
    while True:
        line = input()
        line = 'PRIVMSG ' + channel + ' :' + line.strip() + '\r\n'
        print("SENDING: " + line)
        server.send(bytes(line, 'utf-8'))

print_thread = threading.Thread(target=print_chat)
print_thread.start()
    
send_thread = threading.Thread(target=send_chat)
send_thread.start()

print_thread.join()
send_thread.join()

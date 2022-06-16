# Gait logger server

The peripheral software is written in NodeJs. The server implements different modules like
the serial listener, event emitter, application server, an HyperText Transfer Protocol (HTTP)
server to serve static frontend files, sockets to communicate with clients, and a database
to store the subjects’ details like name, age and height. The gait logger and the data logger
server are connected through serial. The client application and the server are connected using
TCP/IP protocol. The interprocess communication is bridged between the serial listener
and the application server using an event emitter API of NodeJS.

![image](https://user-images.githubusercontent.com/9900412/174105797-0b2edb54-af6b-4513-8daa-2d480a590197.png)

The overall system squence diagram is given below:

![image](https://user-images.githubusercontent.com/9900412/174106042-edd7639b-6a0a-4547-84df-b2f1a47bd43b.png)

# Project Setup Guide

1. Clone the repository
2. yarn
3. connect the Arduino BLE sense 33 in any USB port
4. cp .env.example .env
5. yarn start:dev


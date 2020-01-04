# Hermes
### Introduction
Hello, and welcome to Hermes Messenger!
Hermes is an open source decentralized messaging network with web, mobile, & desktop clients.

### Getting Started With the Web Client
If you'd like to try out hermes first-hand without having to set up your own server, simply create an account here: https://hermesmessenger.chat.   
After you do so, you should ready to go. Feel free to drop by and say hi!

### Testing Server
The normal server is updated to the `master` branch, but most developing happens on `testing`. If you want to test this branch, you can use https://testing.hermesmessenger.chat instead.

*Disclaimer: the testing server is **unstable** and may have serious **security** and **performance** issues. **Use at your own risk.***

## Typescript implementation
Currently, we're working on porting Hermes from Javascript to Typescript, because the codebase was really big and hard to work on using JS. That's why we chose TS to continue working on this, because at least it has types, which help a lot in figuring out how a function should be used. Also, the porting gives us the opportunity to clean up the code, and make it more readable.

This port means we aren't adding new features or updating the master or testing branches of Hermes, as we're focusing on typescript. We hope that in the near future we finish the port and can release v4.0.0, with a lot of improvements, such as a data usage improvment that using WebSockets gives Hermes.

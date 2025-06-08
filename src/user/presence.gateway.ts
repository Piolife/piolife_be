import {
    WebSocketGateway,
    OnGatewayConnection,
    OnGatewayDisconnect,
    WebSocketServer,
  } from '@nestjs/websockets';
  import { Server, Socket } from 'socket.io';
  import { UserService } from './user.service'; 
  
  @WebSocketGateway({
    cors: {
      origin: '*', 
    },
  })
  export class PresenceGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;
  
    constructor(private readonly userService: UserService) {}
  
    async handleConnection(client: Socket) {
      const userId = client.handshake.query.userId as string;
  
      if (userId) {
        await this.userService.setUserOnlineStatus(userId, true);
        this.server.emit('userStatusChanged', { userId, isOnline: true });
      }
    }
  
    async handleDisconnect(client: Socket) {
      const userId = client.handshake.query.userId as string;
  
      if (userId) {
        await this.userService.setUserOnlineStatus(userId, false);
        this.server.emit('userStatusChanged', { userId, isOnline: false });
      }
    }
  }
  
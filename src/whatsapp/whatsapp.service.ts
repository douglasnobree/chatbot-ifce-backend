import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class WhatsappService {
  private readonly apiUrl = 'url'; 

  async newInstance(dados: any) {
    const response = await axios.post(`${this.apiUrl}/router-instance`, dados);
    return response.data;
  }

  async searchInstance(id: string) {
    const response = await axios.get(`${this.apiUrl}/router-instance-search/${id}`);
    return response.data;
  }

  async connectInstance(id: string) {
    const response = await axios.post(`${this.apiUrl}/router-connection`, { id });
    return response.data;
  }

  async sendMessage(dados: any) {
    const response = await axios.post(`${this.apiUrl}/router-send-message`, dados);
    return response.data;
  }
}

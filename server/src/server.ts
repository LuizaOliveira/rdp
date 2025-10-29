import app from './app';
import { config } from './config';

app.listen(config.port, () => {
  console.log(`🚀 Servidor rodando na porta ${config.port}`);
  console.log(`📍 http://localhost:${config.port}`);
  console.log(`📊 API: http://localhost:${config.port}/api`);
});

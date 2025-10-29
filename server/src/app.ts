import express from 'express';
import cors from 'cors';
import { config } from './config';
import routes from './routes';
import { errorHandler } from './middlewares/errorHandler';

const app = express();

// Middlewares - CORS configurado para aceitar qualquer porta do localhost
app.use(cors({ 
  origin: (origin, callback) => {
    // Permitir requisições sem origin (como Postman) e qualquer localhost
    if (!origin || origin.startsWith('http://localhost:') || origin.includes('front-rdp-production.up.railway.app')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/', (req, res) => {
  res.json({ 
    message: 'API de Previdência - Funcionando!',
    version: '1.0.0'
  });
});

app.use('/api', routes);

// Error handler (deve ser o último middleware)
app.use(errorHandler);

export default app;

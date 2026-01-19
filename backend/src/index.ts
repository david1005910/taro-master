import app from './app';
import { config } from './config/env';

const PORT = config.PORT;

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`Environment: ${config.NODE_ENV}`);
});

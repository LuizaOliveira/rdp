import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { PdfUpload } from './pages/PdfUpload';
import Home from './pages/Home';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/upload" element={<PdfUpload />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
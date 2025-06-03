import React, { useState } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import './App.css';

function App() {
  const [images, setImages] = useState([]);
  const [layout, setLayout] = useState('horizontal');
  const [borderWidth, setBorderWidth] = useState(12);
  const [borderColor, setBorderColor] = useState('#ffffff');
  const [status, setStatus] = useState(null);
  const [collageUrl, setCollageUrl] = useState(null);
  const [errorDetails, setErrorDetails] = useState(null);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (images.length === 0) {
      setStatus('ERROR');
      setErrorDetails('No images selected');
      return;
    }

    const formData = new FormData();
    images.forEach((img) => formData.append('images', img));
    formData.append('layout', layout);
    formData.append('border_width', parseInt(borderWidth) || 0);
    formData.append('border_color', borderColor);

    try {
      setStatus('waiting');
      const res = await axios.post('http://localhost:5000/api/create-task', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 60000,
      });
      checkStatus(res.data.task_id);
    } catch (error) {
      setStatus('ERROR');
      setErrorDetails(error.response?.data?.details || error.message);
    }
  };

  const checkStatus = async (id) => {
    const interval = setInterval(async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/check-status?id=${id}`);
        setStatus(res.data.status);
        if (res.data.status === 'DONE') {
          clearInterval(interval);
          const collageRes = await axios.get(`http://localhost:5000/api/get-collage?id=${res.data.collage_id}`, {
            responseType: 'blob',
          });
          setCollageUrl(URL.createObjectURL(collageRes.data));
          setErrorDetails(null);
        } else if (res.data.status === 'failed' || res.data.status === 'NOT_FOUND') {
          clearInterval(interval);
          setStatus('ERROR');
          setErrorDetails('Task failed or not found');
        }
      } catch (error) {
        setStatus('ERROR');
        setErrorDetails(error.response?.data?.message || error.message);
        clearInterval(interval);
      }
    }, 1000);
  };

  const removeImage = (indexToRemove) => {
    setImages(images.filter((_, index) => index !== indexToRemove));
  };

  return (
    <div className="app-container">
      {/* Left panel */}
      <div className="upload-panel">
        <h3>Upload Image</h3>

        <input
          type="file"
          multiple
          accept="image/png,image/jpeg"
          onChange={(e) => setImages([...images, ...e.target.files])}
        />

        {images.length > 0 && (
          <div className="image-list">
            <AnimatePresence>
              {images.map((img, index) => (
                <motion.div
                  key={img.name + index}
                  className="image-item"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                >
                  <img
                    src={URL.createObjectURL(img)}
                    alt={`Image ${index + 1}`}
                    className="image-thumb"
                  />
                  <span className="image-name">{img.name}</span>
                  <button
                    onClick={() => removeImage(index)}
                    className="remove-btn"
                  >
                    ×
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        <div className="radio-group">
          <label>
            <input
              type="radio"
              value="horizontal"
              checked={layout === 'horizontal'}
              onChange={(e) => setLayout(e.target.value)}
            /> Horizontal collage
          </label>
          <br />
          <label>
            <input
              type="radio"
              value="vertical"
              checked={layout === 'vertical'}
              onChange={(e) => setLayout(e.target.value)}
            /> Vertical collage
          </label>
        </div>

        <div className="border-input">
          <label>Border</label>
          <input
            type="number"
            value={borderWidth}
            onChange={(e) => setBorderWidth(e.target.value)}
            min="0"
          /> px
        </div>

        <div className="color-input">
          <label>Color</label>
          <input
            type="color"
            value={borderColor}
            onChange={(e) => setBorderColor(e.target.value)}
          />
          <span>{borderColor}</span>
        </div>

        <motion.button
          type="submit"
          onClick={handleUpload}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="make-collage-btn"
        >
          Make Collage
        </motion.button>
      </div>

      {/* Right panel - Preview */}
      <div className="preview-panel">
        {status === 'waiting' || status === 'active' ? (
          <p className="status-message">Đang xử lý...</p>
        ) : status === 'ERROR' ? (
          <p className="status-message error">
            Lỗi: Không thể xử lý ảnh.<br />Chi tiết: {errorDetails || 'Vui lòng kiểm tra kết nối hoặc thử lại.'}
          </p>
        ) : collageUrl ? (
          <div>
            <motion.img
              src={collageUrl}
              alt="Collage"
              className="collage-image"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            />
            <a href={collageUrl} download="collage.png">
              <button className="download-btn">Download</button>
            </a>
          </div>
        ) : (
          <div className="status-message">
            <p>Kéo thả ảnh hoặc nhấn <strong>"Make Collage"</strong> để tạo ảnh ghép</p>
          </div>
        )}
      </div>
    </div>
  );
}

// export default App;
export default App;

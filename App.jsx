
// import { useRef, useEffect, useState } from 'react';
// import './App.css';
// import * as faceapi from 'face-api.js';

// function App() {
//   const videoRef = useRef();
//   const canvasRef = useRef();
//   const [faceCount, setFaceCount] = useState(0);
//   const [expressions, setExpressions] = useState([]);

//   useEffect(() => {
//     navigator.mediaDevices.getUserMedia({ video: true })
//       .then(stream => videoRef.current.srcObject = stream)
//       .catch(err => console.error("Camera error:", err));
    
//     (async () => {
//       await Promise.all([
//         faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
//         faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
//         faceapi.nets.faceExpressionNet.loadFromUri('/models')
//       ]);
//       detectFaces();
//     })();
//   }, []);

//   const detectFaces = () => {
//     setInterval(async () => {
//       if (!videoRef.current || !canvasRef.current) return;

//       const detections = await faceapi.detectAllFaces(
//         videoRef.current,
//         new faceapi.TinyFaceDetectorOptions()
//       ).withFaceLandmarks().withFaceExpressions();

//       const dims = {
//         width: videoRef.current.videoWidth,
//         height: videoRef.current.videoHeight,
//       };

//       faceapi.matchDimensions(canvasRef.current, dims);
//       const resizedDetections = faceapi.resizeResults(detections, dims);

//       const ctx = canvasRef.current.getContext("2d");
//       ctx.clearRect(0, 0, dims.width, dims.height);

//       faceapi.draw.drawDetections(canvasRef.current, resizedDetections);
//       faceapi.draw.drawFaceLandmarks(canvasRef.current, resizedDetections);

//       const updatedExpressions = resizedDetections.map(({ expressions, detection }) => {
//         const [expression, confidence] = Object.entries(expressions).sort((a, b) => b[1] - a[1])[0];
//         const { x, y, width } = detection.box;

//         ctx.fillStyle = "rgba(255, 255, 0, 0.8)";
//         ctx.fillRect(x, y - 30, width, 24);
//         ctx.fillStyle = "black";
//         ctx.font = "16px Arial";
//         ctx.fillText(`${expression} - ${(confidence * 100).toFixed(0)}%`, x + 5, y - 12);

//         return { expression, confidence };
//       });

//       setFaceCount(resizedDetections.length);
//       setExpressions(updatedExpressions);
//     }, 200);
//   };

//   const getPhrase = (expression) => ({
//     happy: "You're glowing!",
//     sad: "Sending virtual hugs!",
//     angry: "Take a deep breath!",
//     surprised: "Whoa! Didn't see that coming!",
//     disgusted: "Yikes! What happened?",
//     fearful: "Don't worry, you're safe!",
//     neutral: "Just chilling 😎"
//   }[expression] || "Express yourself!");

//   return (
//     <div className="container">
//       <div className="left-panel">
//         <video ref={videoRef} autoPlay muted width="720" height="560" />
//         <canvas ref={canvasRef} width="720" height="560" />
//       </div>

//       <div className="right-panel">
//         <h2>Face Detection Info</h2>
//         <p><strong>Faces Detected:</strong> {faceCount}</p>
//         {expressions.map((exp, idx) => (
//           <div key={idx} className="expression-card">
//             <p><strong>Face {idx + 1}</strong></p>
//             <p>Expression: <span className="exp">{exp.expression}</span></p>
//             <p className="phrase">💬 {getPhrase(exp.expression)}</p>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }

// export default App;



import { useRef, useEffect, useState } from 'react';
import './App.css';
import * as faceapi from 'face-api.js';

function App() {
  const videoRef = useRef();
  const canvasRef = useRef();
  const detectionIntervalRef = useRef(null);

  const [faceCount, setFaceCount] = useState(0);
  const [expressions, setExpressions] = useState([]);
  const [modelsLoaded, setModelsLoaded] = useState(false);

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(stream => videoRef.current.srcObject = stream)
      .catch(err => console.error("Camera error:", err));
    
    (async () => {
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
        faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
        faceapi.nets.faceExpressionNet.loadFromUri('/models')
      ]);
      setModelsLoaded(true);
    })();
  }, []);

  const detectFaces = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const detections = await faceapi.detectAllFaces(
      videoRef.current,
      new faceapi.TinyFaceDetectorOptions()
    ).withFaceLandmarks().withFaceExpressions();

    const dims = {
      width: videoRef.current.videoWidth,
      height: videoRef.current.videoHeight,
    };

    faceapi.matchDimensions(canvasRef.current, dims);
    const resizedDetections = faceapi.resizeResults(detections, dims);

    const ctx = canvasRef.current.getContext("2d");
    ctx.clearRect(0, 0, dims.width, dims.height);

    faceapi.draw.drawDetections(canvasRef.current, resizedDetections);
    faceapi.draw.drawFaceLandmarks(canvasRef.current, resizedDetections);

    const updatedExpressions = resizedDetections.map(({ expressions, detection }) => {
      const [expression, confidence] = Object.entries(expressions).sort((a, b) => b[1] - a[1])[0];
      const { x, y, width } = detection.box;

      ctx.fillStyle = "rgba(255, 255, 0, 0.8)";
      ctx.fillRect(x, y - 30, width, 24);
      ctx.fillStyle = "black";
      ctx.font = "16px Arial";
      ctx.fillText(`${expression} - ${(confidence * 100).toFixed(0)}%`, x + 5, y - 12);

      return { expression, confidence };
    });

    setFaceCount(resizedDetections.length);
    setExpressions(updatedExpressions);
  };

  const startDetection = () => {
    if (detectionIntervalRef.current || !modelsLoaded) return;
    detectionIntervalRef.current = setInterval(detectFaces, 200);
  };

  const stopDetection = () => {
    clearInterval(detectionIntervalRef.current);
    detectionIntervalRef.current = null;

    setFaceCount(0);
    setExpressions([]);

    const ctx = canvasRef.current.getContext("2d");
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  };

  const getPhrase = (expression) => ({
    happy: "You're glowing!",
    sad: "Sending virtual hugs!",
    angry: "Take a deep breath!",
    surprised: "Whoa! Didn't see that coming!",
    disgusted: "Yikes! What happened?",
    fearful: "Don't worry, you're safe!",
    neutral: "Just chilling 😎"
  }[expression] || "Express yourself!");

  return (
    <div className="container">
      <div className="left-panel">
        <video ref={videoRef} autoPlay muted width="720" height="560" />
        <canvas ref={canvasRef} width="720" height="560" />
      </div>

      <div className="right-panel">
        {/* Buttons on top right */}
        <h2>Face Detection App</h2>
        <br />
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginBottom: '10px' }}>
          <button onClick={startDetection}>Start Detection</button>
          <button onClick={stopDetection}>Stop Detection</button>
        </div>

        
        <p><strong>Faces Detected:</strong> {faceCount}</p>
        {expressions.map((exp, idx) => (
          <div key={idx} className="expression-card">
            <p><strong>Face {idx + 1}</strong></p>
            <p>Expression: <span className="exp">{exp.expression}</span></p>
            <p className="phrase">💬 {getPhrase(exp.expression)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;

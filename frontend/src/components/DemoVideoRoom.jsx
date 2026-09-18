import { useState } from "react";
import { FiVideo, FiVideoOff, FiMic, FiMicOff, FiPhoneOff } from "react-icons/fi";

export default function DemoVideoRoom({ doctorName, image }) {
  const [stage, setStage] = useState("waiting");
  const [mic, setMic] = useState(false);
  const [camera, setCamera] = useState(false);
  return <section className="demo-video-room" aria-label="Tư vấn video giả lập">
    <span className="video-demo-badge">PHÒNG TƯ VẤN MẪU</span>
    <img src={image} alt="" />
    <h2>{doctorName}</h2>
    <p role="status">{stage === "waiting" ? "Bạn đang ở phòng chờ mẫu" : stage === "active" ? "Đang hiển thị cuộc gọi giả lập" : "Cuộc gọi mẫu đã kết thúc"}</p>
    <p>Không truy cập camera, micro hay kết nối tới bác sĩ.</p>
    {stage === "active" ? <div className="video-controls">
      <button type="button" aria-label={mic ? "Tắt micro mẫu" : "Bật micro mẫu"} aria-pressed={mic} onClick={() => setMic(!mic)}>{mic ? <FiMic /> : <FiMicOff />}</button>
      <button type="button" aria-label={camera ? "Tắt camera mẫu" : "Bật camera mẫu"} aria-pressed={camera} onClick={() => setCamera(!camera)}>{camera ? <FiVideo /> : <FiVideoOff />}</button>
      <button type="button" className="end-call" aria-label="Kết thúc cuộc gọi mẫu" onClick={() => { setStage("ended"); setMic(false); setCamera(false); }}><FiPhoneOff /></button>
    </div> : <button className="button white" type="button" onClick={() => setStage("active")}>{stage === "waiting" ? "Vào cuộc gọi mẫu" : "Xem lại cuộc gọi mẫu"}</button>}
  </section>;
}

const SuccessOverlay: React.FC<{ onClose: () => void }> = ({ onClose }) => (
  <div className="info-card">
    <h2>Community submitted!</h2>
    <p>Thank you for adding your community to the map.</p>
    <button className="button" onClick={onClose}>
      Close
    </button>
  </div>
);

export default SuccessOverlay;

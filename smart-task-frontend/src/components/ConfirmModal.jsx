import React from "react";

function ConfirmModal({ show, title, message, confirmText = "Confirm", cancelText = "Cancel", variant = "danger", onConfirm, onCancel }) {
  if (!show) return null;

  return (
    <>
      <div 
        className="modal fade show" 
        style={{ display: "block", zIndex: 1055 }} 
        role="dialog" 
        aria-modal="true"
        onClick={onCancel}
      >
        <div className="modal-dialog modal-dialog-centered" role="document" onClick={(e) => e.stopPropagation()}>
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">{title}</h5>
              <button type="button" className="btn-close" aria-label="Close" onClick={onCancel} />
            </div>
            <div className="modal-body">
              <div className="text-muted">{message}</div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-outline-secondary" onClick={onCancel}>
                {cancelText}
              </button>
              <button 
                type="button" 
                className={`btn btn-${variant}`} 
                onClick={() => {
                  onConfirm();
                }}
              >
                {confirmText}
              </button>
            </div>
          </div>
        </div>
      </div>
      <div 
        className="modal-backdrop fade show" 
        style={{ zIndex: 1050 }}
      />
    </>
  );
}

export default ConfirmModal;

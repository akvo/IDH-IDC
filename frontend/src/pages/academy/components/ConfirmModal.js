import React, { useRef } from "react";
import { Button, Modal } from "antd";
import "./ConfirmModal.scss";

// Academy confirmation dialog (Figma): title with close icon over a divider,
// body text, and two equal-width actions (outlined cancel, filled confirm).
// Pass `cancelText={null}` for a single-action dialog and `danger` for a
// destructive one (red confirm). While `loading`, the confirm button spins
// and the dialog cannot be dismissed.
const ConfirmModal = ({
  open,
  title,
  children,
  confirmText,
  cancelText = "Cancel",
  danger = false,
  loading = false,
  onConfirm,
  onCancel,
}) => {
  const cancelRef = useRef(null);

  return (
    <Modal
      open={open}
      title={title}
      onCancel={loading ? null : onCancel}
      closable={!loading}
      maskClosable={!loading}
      keyboard={!loading}
      centered
      destroyOnClose
      width={480}
      className="academy-confirm-modal"
      // The safe choice gets focus: antd focuses the dialog itself on open,
      // so a plain autoFocus on Cancel would be overridden
      afterOpenChange={(isOpen) => isOpen && cancelRef.current?.focus()}
      footer={
        <div className="academy-confirm-actions">
          {cancelText && (
            <Button ref={cancelRef} onClick={onCancel} disabled={loading}>
              {cancelText}
            </Button>
          )}
          <Button
            type="primary"
            danger={danger}
            loading={loading}
            onClick={onConfirm}
          >
            {confirmText}
          </Button>
        </div>
      }
    >
      {children}
    </Modal>
  );
};

export default ConfirmModal;

import React, { useState } from "react";
import { Button, message } from "antd";
import { FileOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import ConfirmModal from "./ConfirmModal";
import academyService from "../services/academy";
import useSignOut from "../../../hooks/useSignOut";
import { routePath } from "../../../components/route";

// "Delete account": permanent self-service deletion behind an explicit
// confirmation dialog
const DeleteAccountCard = () => {
  const navigate = useNavigate();
  const signOut = useSignOut();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  // 409 from the API: the learner still owns IDC cases, listed so they know
  // what to reassign or delete first. Kept after closing so the dialog does
  // not go blank while it fades out.
  const [blocked, setBlocked] = useState({
    open: false,
    message: "",
    cases: [],
  });
  const closeBlocked = () =>
    setBlocked((current) => ({ ...current, open: false }));

  const handleDelete = () => {
    setDeleting(true);
    academyService
      .deleteAccount()
      .then(() => {
        // Leave the private pages before the session is cleared
        navigate(routePath.academy.landing, { replace: true });
        signOut();
        message.success("Your account has been deleted.");
      })
      .catch((err) => {
        setDeleting(false);
        setConfirmOpen(false);
        if (err?.status === 409) {
          setBlocked({
            open: true,
            message: err.message,
            cases: err.detail?.cases || [],
          });
        } else if (err?.status && err.status < 500) {
          // Server and network errors are already toasted by academyClient
          message.error(err.message);
        }
      });
  };

  return (
    <section
      className="academy-settings-card academy-settings-card--inline"
      aria-labelledby="academy-delete-title"
    >
      <div>
        <h2 id="academy-delete-title" className="academy-settings-title">
          Delete account
        </h2>
        <p className="academy-settings-text">
          Your progress, workbook entries and certificates will be removed
          permanently.
        </p>
      </div>
      <Button danger onClick={() => setConfirmOpen(true)}>
        Delete
      </Button>

      <ConfirmModal
        open={confirmOpen}
        title="Delete your account?"
        confirmText="Delete account"
        danger
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      >
        <p>
          Your progress, workbook entries and certificates will be removed
          permanently. This can&apos;t be undone.
        </p>
      </ConfirmModal>

      <ConfirmModal
        open={blocked.open}
        title="Your account can't be deleted yet"
        confirmText="OK"
        cancelText={null}
        onConfirm={closeBlocked}
        onCancel={closeBlocked}
      >
        <p className="academy-blocking-message">{blocked.message}</p>
        {blocked.cases.length > 0 && (
          <div className="academy-blocking-cases-container">
            <div className="academy-blocking-cases-header">
              <span className="academy-blocking-cases-title">Active cases</span>
              <span className="academy-blocking-cases-badge">
                {blocked.cases.length}
              </span>
            </div>
            <ul className="academy-blocking-cases academy-blocking-cases-list">
              {blocked.cases.map(({ value, label }) => (
                <li
                  key={value}
                  className="academy-blocking-case-item"
                  title={label}
                >
                  <FileOutlined className="academy-blocking-case-icon" />
                  <span className="academy-blocking-case-name">{label}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </ConfirmModal>
    </section>
  );
};

export default DeleteAccountCard;

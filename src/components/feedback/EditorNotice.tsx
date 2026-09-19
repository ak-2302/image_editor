type EditorNoticeProps = {
  message: string | null;
  onClose: () => void;
};

function EditorNotice({ message, onClose }: EditorNoticeProps) {
  if (!message) return null;

  return (
    <div className="editor_notice" role="status" aria-live="polite">
      <span>{message}</span>
      <button type="button" aria-label="通知を閉じる" onClick={onClose}>
        閉じる
      </button>
    </div>
  );
}

export default EditorNotice;

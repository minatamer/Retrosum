import type { FormEventHandler, ReactNode } from "react";
export function ComposerShell({
  children,
  shortcuts,
  value,
  onChange,
  onSubmit,
  disabled = false,
  placeholder = "Ask Retro about your money…",
  footnote,
}: {
  children?: ReactNode;
  shortcuts?: ReactNode;
  value: string;
  onChange?(value: string): void;
  onSubmit?: FormEventHandler<HTMLFormElement>;
  disabled?: boolean;
  placeholder?: string;
  footnote?: string;
}) {
  return (
    <div className="rs-composer-wrap">
      {children && <div className="rs-composer-messages">{children}</div>}
      {shortcuts && <div className="rs-chat-shortcuts">{shortcuts}</div>}
      <form
        className="rs-composer-form rs-glass"
        onSubmit={(event) => {
          event.preventDefault();
          if (!disabled) onSubmit?.(event);
        }}
      >
        <span className="rs-composer-mark" aria-hidden="true">
          <svg width="26" height="26" viewBox="0 0 32 32" fill="none">
            <path
              d="M16 3v26M3 16h26M7 7l18 18M7 25 25 7"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </span>
        <input
          aria-label="Message Retro"
          value={value}
          onChange={(event) => onChange?.(event.target.value)}
          disabled={disabled}
          placeholder={placeholder}
          maxLength={1000}
          autoComplete="off"
        />
        <button
          type="submit"
          aria-label="Send message to Retro"
          disabled={disabled || !value.trim()}
        >
          <span className="rs-arrow" aria-hidden="true">
            ↑
          </span>
        </button>
      </form>
      {footnote && <p className="rs-chat-footnote">{footnote}</p>}
    </div>
  );
}

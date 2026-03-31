import styles from "./Button.module.css";

export default function Button({
  children,
  variant = "primary",
  size = "md",
  fullWidth = false,
  onClick,
  type = "button",
  disabled = false,
}) {
  return (
    <button
      type={type}
      className={[
        styles.btn,
        styles[variant],
        styles[size],
        fullWidth ? styles.full : "",
      ].join(" ")}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

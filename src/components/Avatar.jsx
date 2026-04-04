import styles from "./Avatar.module.css";

export default function Avatar({ avatarBase64, initials = "U", size = 40, isEmployer = false }) {
  const style = {
    width:  size,
    height: size,
    fontSize: size * 0.3,
    borderColor: isEmployer ? "var(--border-p)" : "var(--border-c)",
  };

  return (
    <div className={styles.avatar} style={style}>
      {avatarBase64
        ? <img src={avatarBase64} alt={initials} className={styles.img} />
        : <span style={{ color: isEmployer ? "var(--purple)" : "var(--cyan)" }}>{initials}</span>
      }
    </div>
  );
}

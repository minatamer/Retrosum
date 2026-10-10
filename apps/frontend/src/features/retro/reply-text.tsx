"use client";
import { useEffect, useRef, useState } from "react";
import { animateReplyText } from "./reply-typing";
import styles from "./retro.module.css";

export function ReplyText({ text }: { text: string }) {
  return <TypedReply key={text} text={text} />;
}

function TypedReply({ text }: { text: string }) {
  const element = useRef<HTMLSpanElement>(null);
  const [visible, setVisible] = useState("");
  useEffect(() => {
    if (!element.current) return;
    return animateReplyText(element.current, text, setVisible);
  }, [text]);
  return (
    <span ref={element} className={styles.replyText}>
      <span aria-hidden="true">{visible}</span>
      <span aria-hidden="true" className={styles.replyMeasure}>
        {text}
      </span>
      <span className={styles.replyAccessible}>{text}</span>
    </span>
  );
}

import { useTranslations } from "@vocab/react";
import translations from "./.vocab";
import React from "react";

const MyComponent = () => {
  const { t } = useTranslations(translations);
  return (
    <div>
      I am a paragraph with some <b>bold</b> text and a <a href="/foo">link</a>
    </div>
  );
};

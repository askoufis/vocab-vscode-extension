import { useTranslations } from "@vocab/react";
import translations from "./.vocab";
import React from "react";

const MyComponent = () => {
  const { t } = useTranslations(translations);
  return (
    <div>
      This text <a href="/foo">has</a> two <a href="/bar">links</a>
    </div>
  );
};

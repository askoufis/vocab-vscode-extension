import { useTranslations } from "@vocab/react";
import translations from "./.vocab";
import React from "react";

const MyComponent = () => {
  const { t } = useTranslations(translations);
  const numberOfMessages = 4;
  return <div>You have {numberOfMessages} new messages.</div>;
};

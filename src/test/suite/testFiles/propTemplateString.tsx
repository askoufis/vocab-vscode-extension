import { useTranslations } from "@vocab/react";
import translations from "./.vocab";
import React from "react";

const MyComponent = (props: { name: string }) => {
  const { t } = useTranslations(translations);

  const { name } = props;

  const foo = <div label={`My name is ${name}!`}>{t("Already extracted")}</div>;

  return (
    <div label={`My name is ${props.name}!`}>{t("Already extracted")}</div>
  );
};

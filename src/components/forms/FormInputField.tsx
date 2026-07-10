import React from "react";

export interface FormInputFieldProps {
  id: string;
  name: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  isInvalid: boolean;
  errorMessage: string;
}

export const FormInputField: React.FC<FormInputFieldProps> = ({
  id,
  name,
  label,
  value,
  onChange,
  placeholder,
  isInvalid,
  errorMessage,
}) => {
  return (
    <div className="form__group">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        name={name}
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={isInvalid ? "form__input--error" : ""}
      />
      {isInvalid && <div className="form__error">{errorMessage}</div>}
    </div>
  );
};

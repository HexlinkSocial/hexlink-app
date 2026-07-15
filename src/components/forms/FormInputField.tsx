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
  disabled?: boolean;
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
  disabled,
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
        disabled={disabled}
      />
      {isInvalid && <div className="form__error">{errorMessage}</div>}
    </div>
  );
};

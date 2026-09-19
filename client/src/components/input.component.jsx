import { useState } from "react";

const InputBox = ({ name, type, id, placeholder, value, icon, disable = false, onChange }) => {
    const [passwordVisible, setPasswordVisible] = useState(false);

    const isPassword = type === "password";

    return (
        <div className="relative w-[100%] mb-4">
            <input
                name={name}
                type={isPassword ? (passwordVisible ? "text" : "password") : type}
                id={id}
                placeholder={placeholder}
                /*
                    defaultValue, not value: these inputs are read back through
                    FormData on submit, and a `value` with no onChange would make
                    the field impossible to type in.
                */
                defaultValue={value}
                onChange={onChange}
                disabled={disable}
                className="input-box"
            />

            <i className={"fi " + icon + " input-icon"}></i>

            {isPassword ? (
                <i
                    className={
                        "fi fi-rr-eye" +
                        (!passwordVisible ? "-crossed" : "") +
                        " input-icon left-[auto] right-4 cursor-pointer"
                    }
                    onClick={() => setPasswordVisible((currentVal) => !currentVal)}
                ></i>
            ) : (
                ""
            )}
        </div>
    );
};

export default InputBox;

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { authenticateUser } from "../api/auth";

const AuthPage = ({ isLogin }: { isLogin: boolean }) => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const validationSchema = Yup.object({
    name: !isLogin ? Yup.string().required("Name is required") : Yup.string().notRequired(),
    email: Yup.string().email("Invalid email format").required("Email is required"),
    password: Yup.string()
      .min(6, "Password must be at least 6 characters")
      .required("Password is required"),
    confirmPassword: !isLogin
      ? Yup.string()
          .oneOf([Yup.ref("password")], "Passwords must match")
          .required("Confirm Password is required")
      : Yup.string().notRequired(),
  });
//formik setup
  const formik = useFormik({
    initialValues: { name: "", email: "", password: "", confirmPassword: "" },
    validationSchema,
    validateOnChange: true,
    validateOnBlur: true,
    onSubmit: async (values) => {
      setLoading(true);
      try {
        const payload = isLogin
          ? { email: values.email, password: values.password }
          : {
              name: values.name,
              email: values.email,
              password: values.password,
              confirmPassword: values.confirmPassword,
            };
    
        await authenticateUser(isLogin, payload);
        navigate("/home");
      } catch (error: any) {
        console.error("Authentication error:", error);
        alert(error.message || "Something went wrong. Please try again.");
      } finally {
        setLoading(false);
      }
    },
  });

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#001F3F]">
      <div className="w-full max-w-md p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg">
        <h2 className="text-2xl font-semibold text-center text-gray-800 dark:text-white mb-6">
          {isLogin ? "Login to Your Account" : "Create an Account"}
        </h2>

        <form className="space-y-4" onSubmit={formik.handleSubmit}>
          {/* Name Input (Only for Signup) */}
          {!isLogin && (
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
              <input
                type="text"
                {...formik.getFieldProps("name")}
                className={`mt-1 p-3 border rounded-lg bg-white dark:bg-gray-700 focus:ring focus:ring-indigo-200 ${
                  formik.touched.name && formik.errors.name ? "border-red-500" : "border-gray-300 dark:border-gray-600"
                }`}
                placeholder="Enter your name"
              />
              {formik.touched.name && formik.errors.name && (
                <p className="text-red-500 text-xs mt-1">{formik.errors.name}</p>
              )}
            </div>
          )}

          {/* Email Input */}
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
            <input
              type="email"
              {...formik.getFieldProps("email")}
              className={`mt-1 p-3 border rounded-lg bg-white dark:bg-gray-700 focus:ring focus:ring-indigo-200 ${
                formik.touched.email && formik.errors.email ? "border-red-500" : "border-gray-300 dark:border-gray-600"
              }`}
              placeholder="Enter your email"
            />
            {formik.touched.email && formik.errors.email && (
              <p className="text-red-500 text-xs mt-1">{formik.errors.email}</p>
            )}
          </div>

          {/* Password Input */}
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
            <input
              type="password"
              {...formik.getFieldProps("password")}
              className={`mt-1 p-3 border rounded-lg bg-white dark:bg-gray-700 focus:ring focus:ring-indigo-200 ${
                formik.touched.password && formik.errors.password ? "border-red-500" : "border-gray-300 dark:border-gray-600"
              }`}
              placeholder="Enter your password"
            />
            {formik.touched.password && formik.errors.password && (
              <p className="text-red-500 text-xs mt-1">{formik.errors.password}</p>
            )}
          </div>

          {/* Confirm Password (Only for Signup) */}
          {!isLogin && (
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Confirm Password</label>
              <input
                type="password"
                {...formik.getFieldProps("confirmPassword")}
                className={`mt-1 p-3 border rounded-lg bg-white dark:bg-gray-700 focus:ring focus:ring-indigo-200 ${
                  formik.touched.confirmPassword && formik.errors.confirmPassword
                    ? "border-red-500"
                    : "border-gray-300 dark:border-gray-600"
                }`}
                placeholder="Confirm your password"
              />
              {formik.touched.confirmPassword && formik.errors.confirmPassword && (
                <p className="text-red-500 text-xs mt-1">{formik.errors.confirmPassword}</p>
              )}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!formik.isValid || loading}
            className={`w-full p-3 text-white rounded-lg transition flex items-center justify-center ${
              formik.isValid ? "bg-[#001F3F] hover:bg-opacity-80" : "bg-gray-500"
            }`}
          >
            {loading ? <Loader2 className="animate-spin h-5 w-5 mr-2" /> : isLogin ? "Login" : "Sign Up"}
          </button>
        </form>

        {/* Redirect Link */}
        <p className="text-center text-sm text-gray-600 dark:text-gray-300 mt-4">
          {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
          <Link to={isLogin ? "/signup" : "/login"} className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline">
            {isLogin ? "Sign up" : "Login"}
          </Link>
        </p>
      </div>
    </div>
  );
};

export default AuthPage;
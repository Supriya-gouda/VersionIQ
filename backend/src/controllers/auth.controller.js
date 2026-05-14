import { getProfile, loginUser, registerUser, updateProfile, updateAvatar } from "../services/auth.service.js";
import { asyncHandler } from "../utils/async-handler.js";

export const registerController = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  const result = await registerUser({ name, email, password });

  res.status(201).json({
    success: true,
    ...result,
  });
});

export const loginController = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const result = await loginUser({ email, password });

  res.status(200).json({
    success: true,
    ...result,
  });
});

export const meController = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    user: getProfile(req.user),
  });
});

export const updateProfileController = asyncHandler(async (req, res) => {
  const user = await updateProfile(req.user._id, req.body);
  res.status(200).json({
    success: true,
    user,
  });
});

export const uploadAvatarController = asyncHandler(async (req, res) => {
  const user = await updateAvatar(req.user._id, req.file);
  res.status(200).json({
    success: true,
    user,
  });
});

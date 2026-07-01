import auth from '@react-native-firebase/auth';

export const sendOtp = async ({ phone }: { phone: string }) => {
  return await auth().signInWithPhoneNumber(phone);
};

export const verifyOtp = async ({
  confirmation,
  otp,
}: {
  confirmation: Awaited<ReturnType<typeof sendOtp>>;
  otp: string;
}) => {
  const result = await confirmation.confirm(otp);
  return result?.user ?? null;
};
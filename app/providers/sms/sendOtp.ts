// interface Msg91Response {
//     type: string;
//     message: string;
//     remaining: number;
//     data: any; // You can narrow this down if you know the exact structure
//   }
  
//   export async function sendOtp(phoneNumber: string, otp: string) {
//     const MSG91_AUTH_KEY = process.env.MSG91_AUTH_KEY as string;
//     const MSG91_FLOW_ID = process.env.MSG91_FLOW_ID as string;
  
//     const payload = {
//       template_id: MSG91_FLOW_ID,
//       recipients: [
//         {
//           mobiles: `91${phoneNumber}`, // assumes Indian numbers, modify if needed
//           OTP: otp,  // if your template uses VAR1 for OTP
//         },
//       ],
//     };
  
//     try {
//       const response = await fetch('https://control.msg91.com/api/v5/flow', {
//         method: 'POST',
//         headers: {
//           'authkey': MSG91_AUTH_KEY,
//           'accept': 'application/json',
//           'content-type': 'application/json',
//         },
//         body: JSON.stringify(payload),
//       });
  
//       const result: Msg91Response = await response.json(); // Type the response as Msg91Response
  
//       console.log('MSG91 response:', result);
  
//       if (response.ok) {
//         return { success: true, message: 'OTP sent successfully' };
//       } else {
//         return { success: false, message: result.message || 'Failed to send OTP' };
//       }
//     } catch (error) {
//       console.error('Error sending OTP:', error);
//       return { success: false, message: 'An error occurred while sending OTP' };
//     }
//   }
  
  
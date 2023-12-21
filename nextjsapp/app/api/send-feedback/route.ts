import { auth } from '@/auth'
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {

    const user = (await auth())?.user
    if (!user) {
        return new Response('Unauthorized', {
            status: 401
        })
    }

    const userEmail = user.email

    const json = await req.json()
    const { feedback } = json

    if(!feedback) {
        return new Response('Feedback required', {
            status: 400
        })
    }


    try {
        const data = await resend.emails.send({
          from: 'Acme <onboarding@resend.dev>',
          to: ['aamir@launchcraft.dev'],
          subject: 'Agentboard Feedback from ' + userEmail,
          react: `You've received new feedback on Agentboard from ${userEmail}: ${feedback}`,
        });
    
        return new Response('Feedback sent', {
            status: 200
        })
      } catch (error) {
        console.log(error);
        return new Response('Unexpected error', {
            status: 500
        })
      }


}
import { createAnthropic } from '@ai-sdk/anthropic'
import { generateText } from 'ai'
import { supabaseServer } from '@/lib/supabase-server'
import { CHAT_SYSTEM_PROMPT } from '@/constants/prompts'
import { generatePaletteTool } from '@/lib/tools/generatePalette';

export async function POST(req: Request) {
    const supabase = await supabaseServer();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user)
        return new Response('Unauthorized', { status: 401 });

    const { projectId, prompt } = await req.json();

    const anthropic = createAnthropic({
 apiKey:
      "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",    });

    const result = await generateText({
        model: anthropic('claude-sonnet-4-5-20250929'),
        system: CHAT_SYSTEM_PROMPT,
        tools: { generatePaletteTool },
        messages: [{ role: 'user', content: prompt }],
        experimental_context: { projectId },
    })
    console.log(result)
    const { error: messageError } = await supabase
        .from('messages')
        .insert([{
            project_id: projectId,
            role: 'user',
            content: prompt,
        }, {
            project_id: projectId,
            role: 'assistant',
            content: result.text,
        }]);

    if (messageError)
        return new Response('Failed to save messages', { status: 500 });

    return Response.json({
        text: result.text,
        toolCalls: result.toolCalls,
        toolResults: result.toolResults,
        finishReason: result.finishReason,
        usage: result.usage,
    })
}

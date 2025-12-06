import { NextResponse } from 'next/server';
import { executeWorkflow } from '@/app/lib/workflowEngine';

export async function POST(req: Request) {
    try {
        const { workflowId, leadId, senderId } = await req.json();

        if (!workflowId || !leadId || !senderId) {
            return NextResponse.json({
                error: 'workflowId, leadId, and senderId are required'
            }, { status: 400 });
        }

        console.log(`[TEST] Starting workflow execution: ${workflowId} for lead ${leadId}`);
        console.log(`[TEST] Sender ID: ${senderId}`);

        // Execute the workflow (skip publish check for testing)
        await executeWorkflow(workflowId, leadId, senderId, true);

        return NextResponse.json({
            success: true,
            message: 'Workflow execution started. Check console logs for details.'
        });
    } catch (error) {
        console.error('Error testing workflow:', error);
        return NextResponse.json({
            error: error instanceof Error ? error.message : 'Failed to execute workflow'
        }, { status: 500 });
    }
}

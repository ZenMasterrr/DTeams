import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import Zap from '@/abi/Zap.json';

export async function POST(req: NextRequest, { params }: { params: { webhookId: string } }) {
  const { webhookId } = params;

  try {
    const provider = new ethers.providers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
    const signer = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);
    const zapContract = new ethers.Contract(process.env.ZAP_CONTRACT_ADDRESS!, Zap.abi, signer);

    // Find the Zap with the matching webhookId
    const filter = zapContract.filters.Transfer(ethers.constants.AddressZero, null, null);
    const events = await zapContract.queryFilter(filter);

    let zapIdToExecute = -1;

    for (const event of events) {
      if (!event.args) continue;
      const zapId = event.args.tokenId;
      const zapData = await zapContract.zaps(zapId);
      const decodedWebhookId = ethers.utils.defaultAbiCoder.decode(['string'], zapData.trigger.data)[0];

      if (decodedWebhookId === webhookId) {
        zapIdToExecute = zapId;
        break;
      }
    }

    if (zapIdToExecute !== -1) {
      const tx = await zapContract.execute(zapIdToExecute);
      await tx.wait();
      return NextResponse.json({ message: 'Zap executed successfully' });
    } else {
      return NextResponse.json({ message: 'No Zap found for this webhook' }, { status: 404 });
    }
  } catch (error) {
    console.error('Error executing Zap:', error);
    return NextResponse.json({ message: 'Error executing Zap' }, { status: 500 });
  }
}

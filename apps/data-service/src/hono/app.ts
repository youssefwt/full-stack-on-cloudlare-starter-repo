import { getDestinationForCountry, getRoutingDestinations } from '@/helpers/route-ops';
import { getLink } from '@repo/data-ops/queries/links';
import { cloudflareInfoSchema } from '@repo/data-ops/zod-schema/links';
import { LinkClickMessageType } from '@repo/data-ops/zod-schema/queue';

import { Hono } from 'hono';



export const App = new Hono<{ Bindings: Env }>();


App.get('/:id', async (c) => {
    const id = c.req.param('id');

    const linkInfo = await getRoutingDestinations(c.env, id)
    if (!linkInfo) {
        return c.text('Destination not found', 404);
    }

    const cfHeader = cloudflareInfoSchema.safeParse(c.req.raw.cf)
    if (!cfHeader.success) {
        return c.text('Invalid Cloudflare headers', 400);
    }

    const headers = cfHeader.data
    const destination = getDestinationForCountry(linkInfo, headers.country)

    const queueMessage: LinkClickMessageType = {
        "type": "LINK_CLICK",
        data: {
            id: id,
            country: headers.country,
            destination: destination,
            accountId: linkInfo.accountId,
            latitude: headers.latitude,
            longitude: headers.longitude,
            timestamp: new Date().toISOString()
        }
    }
    // don't kill the worker after the redirect right away, gives time until we execute the queue send
    c.executionCtx.waitUntil(
        c.env.QUEUE.send(queueMessage)
    )

    return c.redirect(destination)
})

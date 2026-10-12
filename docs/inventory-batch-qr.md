# Inventory batch QR labels

## Using the feature

1. Approve a recommendation. In Purchases, select **Print QR label**. The label encodes `agriops:batch:<purchase-id>` and remains the same after receipt. Scanning before receipt shows Awaiting receipt and zero available stock.
2. When the complete delivery arrives, select **Record receipt**. Check the packaging and enter its actual expiration date, batch/lot number, and shelf location. Supplier offer expiration dates are not assumed to be actual batch dates. Receipt creates one batch and increases total inventory atomically.
3. Attach the label to the matching batch/container. Keep different batches separate, even when the item is the same. If you printed a label before receipt, reprint after receipt to include the confirmed details.
4. In the updated AgriOps mobile app, use **Scan item** or the drawer QR scanner. The app loads the batch from the configured backend with the worker’s session. It shows the batch’s remaining amount separately from the total stock for the item.
5. Check the physical item and label, enter the amount issued, and confirm. Both batch and item quantities decrease together. The screen reloads the remaining quantity; the printed QR stays unchanged.
6. Managers can use Inventory → item actions → **Batches & QR labels** to inspect batches and update actual batch details. Metadata edits do not alter quantities. Reprint when printed text changes; scanning always reads the latest server details.

## Issuing rules and existing records

- FIFO: workers manually scan the oldest received available batch and confirm the quantity issued. Receipt time determines priority; expiration dates are displayed for verification but do not reorder batches. Expired batches cannot be issued, so the oldest unexpired batch is next. Scanning alone never changes stock.
- Expired batches cannot be issued. A scanned later batch cannot be used while an eligible older received batch remains. General item-level Use movements allocate across batches in the same order and record the allocations.
- Stock without batch records is preserved as an explicitly marked legacy batch at its next stock movement. No expiration date or historic batch identity is invented.
- Purchase receipts from before this upgrade do not have a reliable remaining batch quantity. Their old purchase QR shows Historical receipt — batch not tracked. Check the item’s tracked batches instead.
- Reordering still uses the existing item-level inventory calculation; this feature does not change the agent’s demand calculation. Expired goods remain part of the recorded physical total but cannot be issued.
- This feature does not send orders or messages to suppliers. Approval, supplier contact, and physical receipt remain separate steps.
- QR labels are AgriOps app references, not public browser links. They contain no session tokens or supplier secrets. A signed-in user and network connection are needed to see current data.

## Deploying

1. Run `backend/inventory_batches_upgrade.sql` against the deployed PostgreSQL inventory database before deploying the updated backend. It only adds the optional offer date and the batch/allocation tables and indexes, and can be run again safely.
2. Deploy the backend, then the web frontend. Local backend startup also includes this additive SQL in the existing Component 3/4 schema upgrade.
3. Rebuild and distribute the updated Flutter mobile app. Already-installed old apps do not recognize `agriops:batch:` labels. Older `agriops:item:` labels remain supported by the updated app.
4. Verify with a test purchase: print its label, receive 5 units with actual batch details, scan, issue 2, and scan again. The batch should show 3 remaining. Check expiration and concurrent-issue protection before rollout.

## Verification

Automated coverage includes receipt atomicity, duplicate receipt rejection, persistent batch metadata, partial issues, FIFO allocation, expired-stock rejection, cross-item batch rejection, concurrency, legacy stock preservation, repeatable schema upgrade, mobile scan/navigation, and web live quantity refresh. Real camera scanning and printer output still need a device/printer check.

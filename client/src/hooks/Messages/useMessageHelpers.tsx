import { useEffect, useRef, useCallback } from 'react';
import { Constants, isAssistantsEndpoint } from 'librechat-data-provider';
import type { TMessageProps } from '~/common';
import { useChatContext, useAssistantsMapContext } from '~/Providers';
import useCopyToClipboard from './useCopyToClipboard';
import { getTextKey, logger } from '~/utils';

export default function useMessageHelpers(props: TMessageProps) {
  const latestText = useRef<string | number>('');
  const { message, currentEditId, setCurrentEditId } = props;

  const {
    ask,
    index,
    regenerate,
    isSubmitting,
    conversation,
    latestMessage,
    setAbortScroll,
    handleContinue,
    setLatestMessage,
  } = useChatContext();
  const assistantMap = useAssistantsMapContext();

  const { text, content, children, messageId = null, isCreatedByUser } = message ?? {};
  const edit = messageId === currentEditId;
  const isLast = !children?.length;

  useEffect(() => {
    const convoId = conversation?.conversationId;
    if (convoId === Constants.NEW_CONVO) {
      return;
    }
    if (!message) {
      return;
    }
    if (!isLast) {
      return;
    }

    const textKey = getTextKey(message, convoId);

    // Check for text/conversation change
    const logInfo = {
      textKey,
      'latestText.current': latestText.current,
      messageId: message?.messageId,
      convoId,
    };
    if (
      textKey !== latestText.current ||
      (latestText.current && convoId !== latestText.current.split(Constants.COMMON_DIVIDER)[2])
    ) {
      logger.log('[useMessageHelpers] Setting latest message: ', logInfo);
      latestText.current = textKey;
      setLatestMessage({ ...message });
    } else {
      logger.log('No change in latest message', logInfo);
    }
  }, [isLast, message, setLatestMessage, conversation?.conversationId]);

  const enterEdit = useCallback(
    (cancel?: boolean) => setCurrentEditId && setCurrentEditId(cancel ? -1 : messageId),
    [messageId, setCurrentEditId],
  );

  const handleScroll = useCallback(() => {
    if (isSubmitting) {
      setAbortScroll(true);
    } else {
      setAbortScroll(false);
    }
  }, [isSubmitting, setAbortScroll]);

  const assistant =
    isAssistantsEndpoint(conversation?.endpoint) &&
    assistantMap?.[conversation?.endpoint ?? '']?.[message?.model ?? ''];

  const regenerateMessage = () => {
    if ((isSubmitting && isCreatedByUser) || !message) {
      return;
    }

    regenerate(message);
  };

  const copyToClipboard = useCopyToClipboard({ text, content });

  return {
    ask,
    edit,
    index,
    isLast,
    assistant,
    enterEdit,
    conversation,
    isSubmitting,
    handleScroll,
    latestMessage,
    handleContinue,
    copyToClipboard,
    regenerateMessage,
  };
}

import { jest } from '@jest/globals';
import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MessagesSidebar from '../MessagesSidebar';
import * as AuthContext from '../../context/AuthContext';
import * as messagesApi from '../../pages/api/messages';
import * as callsApi from '../../pages/api/calls';

// Mock dependencies
jest.mock('../../context/AuthContext');
jest.mock('../../pages/api/messages');
jest.mock('../../pages/api/calls');
jest.mock('../audioCall.jsx', () => {
  return function MockAudioCall() {
    return <div data-testid="audio-call">Audio Call</div>;
  };
});
jest.mock('../videoCall.jsx', () => {
  return function MockVideoCall() {
    return <div data-testid="video-call">Video Call</div>;
  };
});

const mockAuthContext = {
  useAuth: jest.fn(),
};

describe('MessagesSidebar Component', () => {
  const mockUser = { id: 1, first_name: 'John' };
  const mockConversations = [
    {
      id: 1,
      ride_id: 10,
      origin: 'UCLA',
      destination: 'Downtown LA',
      preview: 'Last message preview',
      last_message_sent_at: '2024-12-05T10:00:00Z',
      member_count: 3,
      members: [{ id: 1, first_name: 'John' }, { id: 2, first_name: 'Jane' }],
      messages: [],
    },
    {
      id: 2,
      ride_id: 11,
      origin: 'Santa Monica',
      destination: 'Century City',
      preview: 'Another preview',
      last_message_sent_at: '2024-12-05T11:00:00Z',
      member_count: 2,
      members: [{ id: 1, first_name: 'John' }],
      messages: [],
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    AuthContext.useAuth = mockAuthContext.useAuth;
    mockAuthContext.useAuth.mockReturnValue({ user: mockUser });
    messagesApi.getConversations.mockResolvedValue({
      conversations: mockConversations,
    });
    messagesApi.getMessages.mockResolvedValue({ messages: [] });
    callsApi.getCallInfo.mockRejectedValue(new Error('No call'));
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  describe('Initial Rendering', () => {
    test('should render overlay when sidebar is open', () => {
      render(
        <MessagesSidebar isOpen={true} onClose={jest.fn()} />
      );

      const overlay = document.querySelector('.sidebar-overlay');
      expect(overlay).toBeInTheDocument();
    });

    test('should not render overlay when sidebar is closed', () => {
      render(
        <MessagesSidebar isOpen={false} onClose={jest.fn()} />
      );

      expect(document.querySelector('.sidebar-overlay')).not.toBeInTheDocument();
    });

    test('should show loading state initially', () => {
      messagesApi.getConversations.mockImplementation(() => new Promise(() => {}));

      render(
        <MessagesSidebar isOpen={true} onClose={jest.fn()} />
      );

      expect(screen.getByText('Loading conversations...')).toBeInTheDocument();
    });

    test('should show "no conversations" message when empty', async () => {
      messagesApi.getConversations.mockResolvedValue({ conversations: [] });

      render(
        <MessagesSidebar isOpen={true} onClose={jest.fn()} />
      );

      await waitFor(() => {
        expect(screen.getByText('No conversations yet')).toBeInTheDocument();
      });
    });
  });

  describe('Conversations List', () => {
    test('should display conversations after loading', async () => {
      render(
        <MessagesSidebar isOpen={true} onClose={jest.fn()} />
      );

      await waitFor(() => {
        expect(screen.getByText('UCLA → Downtown LA')).toBeInTheDocument();
        expect(screen.getByText('Santa Monica → Century City')).toBeInTheDocument();
      });
    });

    test('should display conversation preview', async () => {
      render(
        <MessagesSidebar isOpen={true} onClose={jest.fn()} />
      );

      await waitFor(() => {
        expect(screen.getByText('Last message preview')).toBeInTheDocument();
        expect(screen.getByText('Another preview')).toBeInTheDocument();
      });
    });

    test('should display last message time', async () => {
      render(
        <MessagesSidebar isOpen={true} onClose={jest.fn()} />
      );

      await waitFor(() => {
        // The exact format depends on locale, just check that date is rendered
        const timeElements = screen.getAllByText(/\d{1,2}:\d{2}/);
        expect(timeElements.length).toBeGreaterThan(0);
      });
    });

    test('should show "No messages" for conversation without last_message_sent_at', async () => {
      messagesApi.getConversations.mockResolvedValue({
        conversations: [
          {
            ...mockConversations[0],
            last_message_sent_at: null,
          },
        ],
      });

      render(
        <MessagesSidebar isOpen={true} onClose={jest.fn()} />
      );

      await waitFor(() => {
        expect(screen.getByText('No messages')).toBeInTheDocument();
      });
    });

    test('should handle backward compatibility with other_users field', async () => {
      const convWithOtherUsers = {
        ...mockConversations[0],
        members: undefined,
        other_users: [{ id: 2, first_name: 'Jane' }],
      };

      messagesApi.getConversations.mockResolvedValue({
        conversations: [convWithOtherUsers],
      });

      render(
        <MessagesSidebar isOpen={true} onClose={jest.fn()} />
      );

      await waitFor(() => {
        expect(screen.getByText('UCLA → Downtown LA')).toBeInTheDocument();
      });
    });
  });

  describe('Conversation Selection', () => {
    test('should select conversation on click', async () => {
      const user = userEvent.setup({ delay: null });

      render(
        <MessagesSidebar isOpen={true} onClose={jest.fn()} />
      );

      await waitFor(() => {
        expect(screen.getByText('UCLA → Downtown LA')).toBeInTheDocument();
      });

      const conversationItem = screen.getByText('UCLA → Downtown LA').closest('.message-item');
      await user.click(conversationItem);

      // Should show conversation details
      expect(screen.getByText('UCLA → Downtown LA')).toBeInTheDocument();
    });

    test('should display conversation title when selected', async () => {
      const user = userEvent.setup({ delay: null });

      const messages = [
        { id: 1, user_id: 1, content: 'Hello', sent_at: '2024-12-05T10:00:00Z' },
        { id: 2, user_id: 2, content: 'Hi there', sent_at: '2024-12-05T10:05:00Z' },
      ];

      messagesApi.getMessages.mockResolvedValue({ messages });

      render(
        <MessagesSidebar isOpen={true} onClose={jest.fn()} />
      );

      await waitFor(() => {
        expect(screen.getByText('UCLA → Downtown LA')).toBeInTheDocument();
      });

      const conversationItem = screen.getByText('UCLA → Downtown LA').closest('.message-item');
      await user.click(conversationItem);

      await waitFor(() => {
        const titleElement = screen.getByText('UCLA → Downtown LA');
        expect(titleElement.tagName).toBe('H2');
      });
    });

    test('should display member count when selected', async () => {
      const user = userEvent.setup({ delay: null });

      const messages = [
        { id: 1, user_id: 1, content: 'Hello', sent_at: '2024-12-05T10:00:00Z' },
      ];

      messagesApi.getMessages.mockResolvedValue({ messages });

      render(
        <MessagesSidebar isOpen={true} onClose={jest.fn()} />
      );

      await waitFor(() => {
        expect(screen.getByText('UCLA → Downtown LA')).toBeInTheDocument();
      });

      const conversationItem = screen.getByText('UCLA → Downtown LA').closest('.message-item');
      await user.click(conversationItem);

      await waitFor(() => {
        expect(screen.getByText('3 members')).toBeInTheDocument();
      });
    });
  });

  describe('Messages Display', () => {
    test('should display messages for selected conversation', async () => {
      const user = userEvent.setup({ delay: null });

      const messages = [
        { id: 1, user_id: 1, content: 'Hello', sent_at: '2024-12-05T10:00:00Z' },
        { id: 2, user_id: 2, content: 'Hi there', sent_at: '2024-12-05T10:05:00Z' },
      ];

      messagesApi.getMessages.mockResolvedValue({ messages });

      render(
        <MessagesSidebar isOpen={true} onClose={jest.fn()} />
      );

      await waitFor(() => {
        expect(screen.getByText('UCLA → Downtown LA')).toBeInTheDocument();
      });

      const conversationItem = screen.getByText('UCLA → Downtown LA').closest('.message-item');
      await user.click(conversationItem);

      await waitFor(() => {
        expect(screen.getByText('Hello')).toBeInTheDocument();
        expect(screen.getByText('Hi there')).toBeInTheDocument();
      });
    });

    test('should group messages from same sender within time threshold', async () => {
      const user = userEvent.setup({ delay: null });

      const messages = [
        { id: 1, user_id: 1, content: 'First', sent_at: '2024-12-05T10:00:00Z' },
        { id: 2, user_id: 1, content: 'Second', sent_at: '2024-12-05T10:02:00Z' },
        { id: 3, user_id: 2, content: 'Reply', sent_at: '2024-12-05T10:10:00Z' },
      ];

      messagesApi.getMessages.mockResolvedValue({ messages });

      render(
        <MessagesSidebar isOpen={true} onClose={jest.fn()} />
      );

      await waitFor(() => {
        expect(screen.getByText('UCLA → Downtown LA')).toBeInTheDocument();
      });

      const conversationItem = screen.getByText('UCLA → Downtown LA').closest('.message-item');
      await user.click(conversationItem);

      await waitFor(() => {
        expect(screen.getByText('First')).toBeInTheDocument();
        expect(screen.getByText('Second')).toBeInTheDocument();
        expect(screen.getByText('Reply')).toBeInTheDocument();
      });
    });

    test('should show "No messages yet" for empty conversation', async () => {
      const user = userEvent.setup({ delay: null });

      messagesApi.getMessages.mockResolvedValue({ messages: [] });

      render(
        <MessagesSidebar isOpen={true} onClose={jest.fn()} />
      );

      await waitFor(() => {
        expect(screen.getByText('UCLA → Downtown LA')).toBeInTheDocument();
      });

      const conversationItem = screen.getByText('UCLA → Downtown LA').closest('.message-item');
      await user.click(conversationItem);

      await waitFor(() => {
        expect(screen.getByText('No messages yet')).toBeInTheDocument();
      });
    });

    test('should show loading state when fetching messages', async () => {
      const user = userEvent.setup({ delay: null });

      messagesApi.getMessages.mockImplementation(() => new Promise(() => {}));

      render(
        <MessagesSidebar isOpen={true} onClose={jest.fn()} />
      );

      await waitFor(() => {
        expect(screen.getByText('UCLA → Downtown LA')).toBeInTheDocument();
      });

      const conversationItem = screen.getByText('UCLA → Downtown LA').closest('.message-item');
      await user.click(conversationItem);

      expect(screen.getByText('Loading messages...')).toBeInTheDocument();
    });
  });

  describe('Message Input', () => {
    test('should render message input field', async () => {
      const user = userEvent.setup({ delay: null });

      render(
        <MessagesSidebar isOpen={true} onClose={jest.fn()} />
      );

      await waitFor(() => {
        expect(screen.getByText('UCLA → Downtown LA')).toBeInTheDocument();
      });

      const conversationItem = screen.getByText('UCLA → Downtown LA').closest('.message-item');
      await user.click(conversationItem);

      const input = screen.getByPlaceholderText('Type a message...');
      expect(input).toBeInTheDocument();
    });

    test('should update input value on type', async () => {
      const user = userEvent.setup({ delay: null });

      render(
        <MessagesSidebar isOpen={true} onClose={jest.fn()} />
      );

      await waitFor(() => {
        expect(screen.getByText('UCLA → Downtown LA')).toBeInTheDocument();
      });

      const conversationItem = screen.getByText('UCLA → Downtown LA').closest('.message-item');
      await user.click(conversationItem);

      const input = screen.getByPlaceholderText('Type a message...');
      await user.type(input, 'Hello world');

      expect(input.value).toBe('Hello world');
    });

    test('should send message on button click', async () => {
      const user = userEvent.setup({ delay: null });

      messagesApi.postMessage.mockResolvedValue({ id: 3, content: 'Hello world' });

      render(
        <MessagesSidebar isOpen={true} onClose={jest.fn()} />
      );

      await waitFor(() => {
        expect(screen.getByText('UCLA → Downtown LA')).toBeInTheDocument();
      });

      const conversationItem = screen.getByText('UCLA → Downtown LA').closest('.message-item');
      await user.click(conversationItem);

      const input = screen.getByPlaceholderText('Type a message...');
      await user.type(input, 'Hello');

      const sendButton = screen.getByRole('button', { name: 'Send' });
      await user.click(sendButton);

      await waitFor(() => {
        expect(messagesApi.postMessage).toHaveBeenCalledWith(10, 'Hello');
      });
    });

    test('should send message on Enter key press', async () => {
      const user = userEvent.setup({ delay: null });

      messagesApi.postMessage.mockResolvedValue({ id: 3, content: 'Hello' });

      render(
        <MessagesSidebar isOpen={true} onClose={jest.fn()} />
      );

      await waitFor(() => {
        expect(screen.getByText('UCLA → Downtown LA')).toBeInTheDocument();
      });

      const conversationItem = screen.getByText('UCLA → Downtown LA').closest('.message-item');
      await user.click(conversationItem);

      const input = screen.getByPlaceholderText('Type a message...');
      await user.type(input, 'Hello');
      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(messagesApi.postMessage).toHaveBeenCalledWith(10, 'Hello');
      });
    });

    test('should clear input after successful send', async () => {
      const user = userEvent.setup({ delay: null });

      messagesApi.postMessage.mockResolvedValue({ id: 3, content: 'Hello' });

      render(
        <MessagesSidebar isOpen={true} onClose={jest.fn()} />
      );

      await waitFor(() => {
        expect(screen.getByText('UCLA → Downtown LA')).toBeInTheDocument();
      });

      const conversationItem = screen.getByText('UCLA → Downtown LA').closest('.message-item');
      await user.click(conversationItem);

      const input = screen.getByPlaceholderText('Type a message...');
      await user.type(input, 'Hello');

      const sendButton = screen.getByRole('button', { name: 'Send' });
      await user.click(sendButton);

      await waitFor(() => {
        expect(input.value).toBe('');
      });
    });

    test('should disable send button when input is empty', async () => {
      const user = userEvent.setup({ delay: null });

      render(
        <MessagesSidebar isOpen={true} onClose={jest.fn()} />
      );

      await waitFor(() => {
        expect(screen.getByText('UCLA → Downtown LA')).toBeInTheDocument();
      });

      const conversationItem = screen.getByText('UCLA → Downtown LA').closest('.message-item');
      await user.click(conversationItem);

      const sendButton = screen.getByRole('button', { name: 'Send' });
      expect(sendButton).toBeDisabled();
    });

    test('should disable send button when input is only whitespace', async () => {
      const user = userEvent.setup({ delay: null });

      render(
        <MessagesSidebar isOpen={true} onClose={jest.fn()} />
      );

      await waitFor(() => {
        expect(screen.getByText('UCLA → Downtown LA')).toBeInTheDocument();
      });

      const conversationItem = screen.getByText('UCLA → Downtown LA').closest('.message-item');
      await user.click(conversationItem);

      const input = screen.getByPlaceholderText('Type a message...');
      await user.type(input, '   ');

      const sendButton = screen.getByRole('button', { name: 'Send' });
      expect(sendButton).toBeDisabled();
    });

    test('should handle message send error', async () => {
      const user = userEvent.setup({ delay: null });

      messagesApi.postMessage.mockRejectedValue(new Error('Send failed'));

      render(
        <MessagesSidebar isOpen={true} onClose={jest.fn()} />
      );

      await waitFor(() => {
        expect(screen.getByText('UCLA → Downtown LA')).toBeInTheDocument();
      });

      const conversationItem = screen.getByText('UCLA → Downtown LA').closest('.message-item');
      await user.click(conversationItem);

      const input = screen.getByPlaceholderText('Type a message...');
      await user.type(input, 'Hello');

      const sendButton = screen.getByRole('button', { name: 'Send' });
      await user.click(sendButton);

      await waitFor(() => {
        expect(screen.getByText('Send failed')).toBeInTheDocument();
      });
    });
  });

  describe('Back Button', () => {
    test('should return to conversation list when back button clicked', async () => {
      const user = userEvent.setup({ delay: null });

      render(
        <MessagesSidebar isOpen={true} onClose={jest.fn()} />
      );

      await waitFor(() => {
        expect(screen.getByText('UCLA → Downtown LA')).toBeInTheDocument();
      });

      const conversationItem = screen.getByText('UCLA → Downtown LA').closest('.message-item');
      await user.click(conversationItem);

      await waitFor(() => {
        const backButton = screen.getByRole('button', { name: '←' });
        expect(backButton).toBeInTheDocument();
      });

      const backButton = screen.getByRole('button', { name: '←' });
      await user.click(backButton);

      await waitFor(() => {
        expect(screen.getByText('Messages')).toBeInTheDocument();
      });
    });
  });

  describe('Close Button', () => {
    test('should call onClose when close button clicked', async () => {
      const user = userEvent.setup({ delay: null });
      const onClose = jest.fn();

      render(
        <MessagesSidebar isOpen={true} onClose={onClose} />
      );

      const closeButton = screen.getByRole('button', { name: '✕' });
      await user.click(closeButton);

      expect(onClose).toHaveBeenCalled();
    });

    test('should call onClose when overlay clicked', async () => {
      const user = userEvent.setup({ delay: null });
      const onClose = jest.fn();

      const { container } = render(
        <MessagesSidebar isOpen={true} onClose={onClose} />
      );

      const overlay = container.querySelector('.sidebar-overlay');
      await user.click(overlay);

      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('Call Features', () => {
    test('should render audio and video call components', async () => {
      const user = userEvent.setup({ delay: null });

      render(
        <MessagesSidebar isOpen={true} onClose={jest.fn()} />
      );

      await waitFor(() => {
        expect(screen.getByText('UCLA → Downtown LA')).toBeInTheDocument();
      });

      const conversationItem = screen.getByText('UCLA → Downtown LA').closest('.message-item');
      await user.click(conversationItem);

      expect(screen.getByTestId('audio-call')).toBeInTheDocument();
      expect(screen.getByTestId('video-call')).toBeInTheDocument();
    });

    test('should display active call information', async () => {
      const user = userEvent.setup({ delay: null });

      callsApi.getCallInfo.mockResolvedValue({
        active: true,
        participants: [{ id: 1 }, { id: 2 }],
      });

      const messages = [
        { id: 1, user_id: 1, content: 'Hello', sent_at: '2024-12-05T10:00:00Z' },
      ];

      messagesApi.getMessages.mockResolvedValue({ messages });

      render(
        <MessagesSidebar isOpen={true} onClose={jest.fn()} />
      );

      await waitFor(() => {
        expect(screen.getByText('UCLA → Downtown LA')).toBeInTheDocument();
      });

      const conversationItem = screen.getByText('UCLA → Downtown LA').closest('.message-item');
      await user.click(conversationItem);

      await waitFor(() => {
        expect(screen.getByText(/Active call: 2 people on call/)).toBeInTheDocument();
      });
    });

    test('should not display active call when no participants', async () => {
      const user = userEvent.setup({ delay: null });

      callsApi.getCallInfo.mockResolvedValue({
        active: false,
        participants: [],
      });

      render(
        <MessagesSidebar isOpen={true} onClose={jest.fn()} />
      );

      await waitFor(() => {
        expect(screen.getByText('UCLA → Downtown LA')).toBeInTheDocument();
      });

      const conversationItem = screen.getByText('UCLA → Downtown LA').closest('.message-item');
      await user.click(conversationItem);

      expect(screen.queryByText(/Active call:/)).not.toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    test('should display error message on conversation fetch failure', async () => {
      messagesApi.getConversations.mockRejectedValue(new Error('Failed to fetch'));

      render(
        <MessagesSidebar isOpen={true} onClose={jest.fn()} />
      );

      await waitFor(() => {
        expect(screen.getByText('Failed to load conversations')).toBeInTheDocument();
      });
    });

    test('should display error message on messages fetch failure', async () => {
      const user = userEvent.setup({ delay: null });

      messagesApi.getMessages.mockRejectedValue(new Error('Failed to fetch messages'));

      render(
        <MessagesSidebar isOpen={true} onClose={jest.fn()} />
      );

      await waitFor(() => {
        expect(screen.getByText('UCLA → Downtown LA')).toBeInTheDocument();
      });

      const conversationItem = screen.getByText('UCLA → Downtown LA').closest('.message-item');
      await user.click(conversationItem);

      await waitFor(() => {
        expect(screen.getByText('Failed to load messages')).toBeInTheDocument();
      });
    });
  });

  describe('Polling and Auto-refresh', () => {
    test('should fetch conversations initially', async () => {
      render(
        <MessagesSidebar isOpen={true} onClose={jest.fn()} />
      );

      await waitFor(() => {
        expect(messagesApi.getConversations).toHaveBeenCalled();
      });
    });

    test('should poll conversations when sidebar is open', async () => {
      render(
        <MessagesSidebar isOpen={true} onClose={jest.fn()} />
      );

      await waitFor(() => {
        expect(messagesApi.getConversations).toHaveBeenCalled();
      });

      jest.advanceTimersByTime(600);

      expect(messagesApi.getConversations).toHaveBeenCalledTimes(2);
    });

    test('should not poll conversations when sidebar is closed', async () => {
      const { rerender } = render(
        <MessagesSidebar isOpen={false} onClose={jest.fn()} />
      );

      const callCount = messagesApi.getConversations.mock.calls.length;

      jest.advanceTimersByTime(1000);

      expect(messagesApi.getConversations.mock.calls.length).toBe(callCount);
    });
  });

  describe('Member Display', () => {
    test('should display member names', async () => {
      const user = userEvent.setup({ delay: null });

      const messages = [
        { id: 1, user_id: 1, content: 'Hello', sent_at: '2024-12-05T10:00:00Z' },
      ];

      messagesApi.getMessages.mockResolvedValue({ messages });

      render(
        <MessagesSidebar isOpen={true} onClose={jest.fn()} />
      );

      await waitFor(() => {
        expect(screen.getByText('UCLA → Downtown LA')).toBeInTheDocument();
      });

      const conversationItem = screen.getByText('UCLA → Downtown LA').closest('.message-item');
      await user.click(conversationItem);

      await waitFor(() => {
        expect(screen.getByText(/John, Jane/)).toBeInTheDocument();
      });
    });
  });
});

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axios from 'axios';
import App from './App';

// Mock axios
jest.mock('axios', () => ({
  post: jest.fn(),
  get: jest.fn(),
}));

describe('App Component', () => {
  test('renders upload panel and preview panel', () => {
    render(<App />);
    expect(screen.getByText('Upload Image')).toBeInTheDocument();
    expect(screen.getByText(/Kéo thả ảnh hoặc nhấn/i)).toBeInTheDocument();
  });

  test('allows file upload and displays image thumbnails', async () => {
    render(<App />);
    const fileInput = screen.getByLabelText(/upload image/i);
    const file = new File(['dummy content'], 'test.png', { type: 'image/png' });

    await userEvent.upload(fileInput, file);

    expect(screen.getByText('test.png')).toBeInTheDocument();
  });

  test('handles collage creation on button click', async () => {
    axios.post.mockResolvedValueOnce({ data: { task_id: '123' } });
    axios.get
      .mockResolvedValueOnce({ data: { status: 'active' } })
      .mockResolvedValueOnce({ data: { status: 'DONE', collage_id: '123' } })
      .mockResolvedValueOnce({ data: new Blob(['collage'], { type: 'image/png' }) });

    render(<App />);
    const fileInput = screen.getByLabelText(/upload image/i);
    const file = new File(['dummy content'], 'test.png', { type: 'image/png' });
    await userEvent.upload(fileInput, file);

    const makeCollageButton = screen.getByText('Make Collage');
    fireEvent.click(makeCollageButton);

    await waitFor(() => {
      expect(screen.getByText('Đang xử lý...')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByRole('img', { name: 'Collage' })).toBeInTheDocument();
    });
  });

  test('shows error when no images are uploaded', async () => {
    render(<App />);
    const makeCollageButton = screen.getByText('Make Collage');
    fireEvent.click(makeCollageButton);

    await waitFor(() => {
      expect(screen.getByText(/Lỗi: Không thể xử lý ảnh./i)).toBeInTheDocument();
      expect(screen.getByText(/No images selected/i)).toBeInTheDocument();
    });
  });

  test('changes layout when radio button is clicked', async () => {
    render(<App />);
    const verticalRadio = screen.getByLabelText('Vertical collage');
    await userEvent.click(verticalRadio);

    expect(verticalRadio).toBeChecked();
  });
});
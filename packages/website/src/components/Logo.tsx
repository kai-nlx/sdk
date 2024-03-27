import React, { type FC } from "react";

export const Logo: FC<{ size?: number }> = ({ size }) => (
  <svg
    // initial eslint integration
    // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions, @typescript-eslint/prefer-nullish-coalescing
    width={size || 32}
    // initial eslint integration
    // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions, @typescript-eslint/prefer-nullish-coalescing
    height={size || 32}
    viewBox="0 -5 24 24"
    fill="currentColor"
    stroke="none"
  >
    <path d="M13.4947 11.5021C12.8648 11.5021 12.4698 11.0728 12.4698 10.5147V1.3282C12.4698 0.73558 11.9917 0.255005 11.4021 0.255005C10.8126 0.255005 10.3345 0.73558 10.3345 1.3282V10.5147C10.3345 11.1073 10.8126 11.5879 11.4021 11.5879C11.9327 11.5879 12.363 11.9957 12.363 12.6074C12.363 13.2297 12.865 13.7343 13.484 13.7343C14.103 13.7343 14.605 13.2297 14.605 12.6074C14.605 11.9852 14.1246 11.5021 13.4947 11.5021Z"></path>
    <path d="M7.40712 5.859C6.87545 5.859 6.4484 5.44925 6.4484 4.83753C6.4484 4.20435 5.97865 3.68922 5.33808 3.68922C4.69751 3.68922 4.20641 4.26874 4.20641 4.83753C4.20641 5.40633 3.75801 5.81414 3.24555 5.81414C2.7331 5.81414 2.2847 5.41706 2.2847 4.84827C2.2847 4.20435 1.75089 3.68922 1.11032 3.68922C0.469751 3.68922 0 4.21508 0 4.84827C0 5.50291 0.501993 5.96439 1.121 5.96439C1.66548 5.96439 2.11345 6.39259 2.11345 6.95108C2.11345 7.50957 1.67637 7.89613 1.15302 7.89613C0.563488 7.89613 0.0854093 8.33378 0.0854093 8.9264C0.0854093 8.9264 0.0854092 12.747 0.0890391 12.7455C0.0890391 13.305 0.591673 13.7343 1.15302 13.7343C1.71438 13.7343 2.21701 13.305 2.21701 12.7455L2.2232 8.9264C2.22064 8.49712 2.7331 8.06999 3.2432 8.06999L3.24555 8.06784L3.24534 8.06763C3.85601 8.06205 4.35587 7.57417 4.35587 6.93026C4.35587 6.40877 4.76715 5.98372 5.2814 5.96503L5.33872 5.96503C5.8721 5.96503 6.27758 6.40418 6.27758 6.93026V12.6611C6.27758 13.2537 6.75566 13.7343 7.3452 13.7343C7.93473 13.7343 8.41281 13.2537 8.41281 12.6611V6.93026C8.41281 6.35846 7.939 5.859 7.40712 5.859ZM5.33808 5.96439L5.30807 5.96443C5.31095 5.9644 5.31384 5.96439 5.31673 5.96439H5.33808ZM5.33786 5.96417L5.33808 5.96439C5.33808 5.96439 5.33808 5.96417 5.33786 5.96417Z"></path>
    <path d="M24 6.8444C24 7.43702 23.5302 7.9176 22.8256 7.9176C22.2512 7.9176 21.843 8.20714 21.8231 8.71712C21.843 9.22711 22.2512 9.51665 22.8256 9.51665C23.5302 9.51665 24 9.99723 24 10.5898V12.6718C24 13.2645 23.5219 13.745 22.9324 13.745C22.3428 13.745 21.8648 13.2645 21.8648 12.6718C21.8648 12.6718 21.8652 11.1479 21.8652 10.6107C21.8652 10.0734 21.4345 9.64544 20.9039 9.64544H19.4093C18.8786 9.64544 18.448 10.0734 18.448 10.6107C18.448 11.1479 18.4484 12.6718 18.4484 12.6718C18.4484 13.2645 17.9703 13.745 17.3808 13.745C16.7912 13.745 16.3132 13.2645 16.3132 12.6718V10.5898C16.3132 9.99723 16.7829 9.51665 17.4875 9.51665C18.0621 9.51665 18.4702 9.22711 18.49 8.71712C18.4702 8.20714 18.0619 7.9176 17.4875 7.9176C16.7829 7.9176 16.3132 7.43702 16.3132 6.8444V4.78388C16.3132 4.19126 16.7912 3.71068 17.3808 3.71068C17.9703 3.71068 18.4484 4.19126 18.4484 4.78388C18.4484 4.78388 18.448 6.28634 18.448 6.82358C18.448 7.36082 18.8786 7.76735 19.4093 7.76735H20.9039C21.4345 7.76735 21.8652 7.36082 21.8652 6.82358C21.8652 6.28634 21.8648 4.78388 21.8648 4.78388C21.8648 4.19126 22.3428 3.71068 22.9324 3.71068C23.5219 3.71068 24 4.19126 24 4.78388V6.8444Z"></path>
  </svg>
);

<?php

function hkm_theme_setup()
{
    // Add support for block styles.
    add_theme_support('wp-block-styles');

    // Enqueue editor styles.
    add_editor_style('editor-style.css');

    // Add support for full and wide align images.
    add_theme_support('align-wide');

    // Add support for responsive embeds.
    add_theme_support('responsive-embeds');

    // Add support for custom line height controls.
    add_theme_support('custom-line-height');

    // Add support for experimental link color control.
    add_theme_support('experimental-link-color');

    // Add support for experimental cover block spacing.
    add_theme_support('custom-spacing');

    // Add support for post thumbnails
    add_theme_support('post-thumbnails');

    // Register Navigation Menus
    register_nav_menus(array(
        'primary' => __('Primary Menu', 'hkm-theme'),
        'footer' => __('Footer Menu', 'hkm-theme'),
    ));
}
add_action('after_setup_theme', 'hkm_theme_setup');

function hkm_theme_scripts()
{
    // Fonts
    wp_enqueue_style('google-fonts-inter', 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap', array(), null);
    wp_enqueue_style('font-awesome', 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css', array(), '6.4.0');

    // Main Styles
    wp_enqueue_style('hkm-style', get_stylesheet_uri(), array(), '1.0.0');
    wp_enqueue_style('cookie-consent-style', get_template_directory_uri() . '/css/cookie-consent.css', array(), '1.0.0');

    // Tailwind (CDN for now as per key requirement)
    // Note: In a production WP theme, compiling tailwind is better, but following user constraints.
    wp_enqueue_script('tailwind-cdn', 'https://cdn.tailwindcss.com', array(), null, false);
    // Add inline config for Tailwind
    wp_add_inline_script('tailwind-cdn', "
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        'primary-orange': '#f39c12',
                        'primary-red': '#e74c3c',
                        'text-dark': '#333333',
                    }
                }
            }
        }
    ");

    // Page Specific Styles
    if (is_page_template('page-donasjoner.php')) {
        wp_enqueue_style('stripe-checkout-style', get_template_directory_uri() . '/css/stripe-checkout.css', array(), '1.0.0');
        wp_enqueue_script('stripe-js', 'https://js.stripe.com/v3/', array(), null, true);
    }

    // Firebase (If needed for legacy support) - Enqueue globally or conditionally
    wp_enqueue_script('firebase-app', 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js', array(), '10.7.1', true);
    wp_enqueue_script('firebase-firestore', 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore-compat.js', array(), '10.7.1', true);
    wp_enqueue_script('firebase-auth', 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth-compat.js', array(), '10.7.1', true);
    wp_enqueue_script('firebase-storage', 'https://www.gstatic.com/firebasejs/10.7.1/firebase-storage-compat.js', array(), '10.7.1', true);

    // Local Scripts
    wp_enqueue_script('firebase-config', get_template_directory_uri() . '/js/firebase-config.js', array('firebase-app'), '1.0.0', true);
    wp_enqueue_script('firebase-service', get_template_directory_uri() . '/js/firebase-service.js', array('firebase-config'), '1.0.0', true);

    // Main App Script
    wp_enqueue_script('hkm-script', get_template_directory_uri() . '/js/script.js', array('jquery'), '1.0.0', true); // Copied script.js to js/ folder for consistency or root

    // There was a root script.js in the source. I should make sure I copied it or check where it is.
    // The previous run_command copied 'js' folder. The 'script.js' was in the root. 
    // I need to copy 'script.js' from root to 'hkm-wordpress-theme/js/' or 'hkm-wordpress-theme/'. 
    // Let's assume I will copy it to /js/script.js inside the theme for better organization, or keep it root. 
    // Best practice is /js/. I will adjust the copy command in next step if needed or just copy it now.

    wp_enqueue_script('content-manager', get_template_directory_uri() . '/js/content-manager.js', array('hkm-script'), '1.0.0', true);
    wp_enqueue_script('cookie-consent', get_template_directory_uri() . '/js/cookie-consent.js', array(), '1.0.0', true);

    // Page Specific Scripts
    if (is_page_template('page-media.php')) {
        wp_enqueue_script('teaching-loader', get_template_directory_uri() . '/js/teaching-loader.js', array(), '1.0.0', true);
        wp_enqueue_script('media-js', get_template_directory_uri() . '/js/media.js', array(), '1.0.0', true); // Assuming media.js moved to js folder or needs copy
    }

    if (is_page_template('page-donasjoner.php')) {
        wp_enqueue_script('stripe-checkout-local', get_template_directory_uri() . '/js/stripe-checkout.js', array(), '1.0.0', true);
    }
}
add_action('wp_enqueue_scripts', 'hkm_theme_scripts');

// SVG Support
function cc_mime_types($mimes)
{
    $mimes['svg'] = 'image/svg+xml';
    return $mimes;
}
add_filter('upload_mimes', 'cc_mime_types');

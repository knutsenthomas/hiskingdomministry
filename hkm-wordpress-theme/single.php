<?php get_header(); ?>

<?php if (have_posts()):
    while (have_posts()):
        the_post(); ?>

        <!-- Blog Post Hero -->
        <section class="page-hero relative" id="blog-hero"
            style="background-image: linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url('<?php echo has_post_thumbnail() ? get_the_post_thumbnail_url(null, 'full') : 'https://images.unsplash.com/photo-1504052434569-70ad5836ab65?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80'; ?>'); padding-top: 180px; margin-top: 0;">
            <div class="container">
                <div class="breadcrumbs" style="margin-bottom: 20px;">
                    <a href="<?php echo home_url(); ?>">Hjem</a>
                    <i class="fas fa-chevron-right"></i>
                    <a href="<?php echo get_post_type_archive_link('post'); ?>">Blogg</a>
                    <i class="fas fa-chevron-right"></i>
                    <span>
                        <?php the_title(); ?>
                    </span>
                </div>
                <h1 class="page-hero-title">
                    <?php the_title(); ?>
                </h1>
                <div class="blog-meta"
                    style="display: flex; gap: 20px; justify-content: center; color: white; margin-top: 20px; flex-wrap: wrap;">
                    <span><i class="far fa-calendar"></i>
                        <?php echo get_the_date(); ?>
                    </span>
                    <span><i class="far fa-user"></i>
                        <?php the_author(); ?>
                    </span>
                    <span><i class="fas fa-tag"></i>
                        <?php echo get_the_category_list(', '); ?>
                    </span>
                </div>
            </div>
        </section>

        <!-- Blog Post Content -->
        <section class="section" style="padding: 80px 0;">
            <div class="container" style="max-width: 800px;">
                <article class="blog-post-content">
                    <?php the_content(); ?>
                </article>

                <!-- Tags -->
                <div class="post-tags" style="margin-top: 40px;">
                    <?php the_tags('<span class="tag"><i class="fas fa-hashtag"></i> ', '</span><span class="tag"><i class="fas fa-hashtag"></i> ', '</span>'); ?>
                </div>

                <!-- Share Section -->
                <div class="blog-share" style="border-top: 1px solid #eee; padding-top: 30px; margin-top: 50px;">
                    <h4>Del dette innlegget</h4>
                    <div style="display: flex; gap: 15px; margin-top: 15px;">
                        <a href="https://www.facebook.com/sharer/sharer.php?u=<?php the_permalink(); ?>" class="social-link"
                            style="background: #3b5998; color: white; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; border-radius: 50%;"
                            target="_blank"><i class="fab fa-facebook-f"></i></a>
                        <a href="https://twitter.com/intent/tweet?url=<?php the_permalink(); ?>&text=<?php the_title(); ?>"
                            class="social-link"
                            style="background: #1DA1F2; color: white; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; border-radius: 50%;"
                            target="_blank"><i class="fab fa-twitter"></i></a>
                        <a href="https://www.linkedin.com/shareArticle?mini=true&url=<?php the_permalink(); ?>"
                            class="social-link"
                            style="background: #0077b5; color: white; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; border-radius: 50%;"
                            target="_blank"><i class="fab fa-linkedin-in"></i></a>
                    </div>
                </div>

                <div class="blog-navigation"
                    style="display: flex; justify-content: space-between; margin-top: 60px; padding-top: 30px; border-top: 1px solid #eee;">
                    <a href="<?php echo get_post_type_archive_link('post'); ?>" class="btn btn-outline"><i
                            class="fas fa-arrow-left"></i> Tilbake til blogg</a>
                </div>
            </div>
        </section>

    <?php endwhile; endif; ?>

<?php get_footer(); ?>